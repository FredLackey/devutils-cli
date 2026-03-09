'use strict';

const shell = require('../../lib/shell');
const { checkQmd } = require('./qmd');

const meta = {
  description: 'Retrieve a document by file path or QMD document ID',
  arguments: [
    { name: 'target', description: 'File path or document ID (e.g., #abc123)', required: true }
  ],
  flags: [
    { name: 'full', type: 'boolean', description: 'Return the entire document instead of a snippet' },
    { name: 'line', type: 'number', description: 'Start at a specific line number' },
    { name: 'max-lines', type: 'number', description: 'Maximum number of lines to return' }
  ]
};

/**
 * Retrieves a document by file path or QMD document ID.
 * Passes the target through to QMD as-is (QMD handles both
 * file paths and #id-style document IDs).
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

  const target = args.positional[0];

  if (!target) {
    context.errors.throwError(400, 'Missing required argument: <target>. Example: dev search get path/to/document.md', 'search');
    return;
  }

  // Build the QMD command
  let cmd = `qmd get "${target}"`;

  if (args.flags.full) {
    cmd += ' --full';
  }
  if (args.flags.line) {
    cmd += ` --line ${args.flags.line}`;
  }
  if (args.flags['max-lines']) {
    cmd += ` --max-lines ${args.flags['max-lines']}`;
  }

  // Execute and capture output
  const result = await shell.exec(cmd);

  if (result.exitCode !== 0) {
    context.errors.throwError(1, result.stderr || `Document not found: ${target}`, 'search');
    return;
  }

  // For get, the output is document content, not search results
  const output = {
    target: target,
    content: result.stdout
  };

  context.output.out(output);
}

module.exports = { meta, run };
