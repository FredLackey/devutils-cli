'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('../../lib/shell');
const { checkQmd } = require('./qmd');

const meta = {
  description: 'Manage searchable collections (add, remove, list)',
  arguments: [
    { name: 'action', description: 'Sub-command: add, remove, or list', required: true },
    { name: 'target', description: 'Directory path (for add) or collection name (for remove)', required: false }
  ],
  flags: [
    { name: 'name', type: 'string', description: 'Collection name (required for add)' },
    { name: 'mask', type: 'string', description: 'Glob pattern to filter indexed files (e.g., "**/*.md")' },
    { name: 'confirm', type: 'boolean', description: 'Skip confirmation prompt (for remove)' }
  ]
};

/**
 * Manages QMD search collections: add, remove, or list.
 * Each action shells out to the corresponding qmd collections command.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors, prompt }.
 */
async function run(args, context) {
  // Check for QMD availability first
  const qmd = checkQmd();
  if (!qmd.available) {
    context.errors.throwError(1, qmd.message, 'search');
    return;
  }

  const action = args.positional[0];

  if (!action) {
    context.output.info('Usage: dev search collections <add|remove|list>');
    return;
  }

  if (action === 'list') {
    // List all registered collections
    const result = await shell.exec('qmd collections list');

    if (result.exitCode !== 0) {
      context.errors.throwError(1, result.stderr || 'Failed to list collections.', 'search');
      return;
    }

    // Try to parse as JSON for structured output
    const output = result.stdout;
    try {
      const parsed = JSON.parse(output);
      context.output.out(parsed);
    } catch (err) {
      // Pass through as-is
      context.output.info(output || 'No collections registered.');
    }

  } else if (action === 'add') {
    // Add a new collection
    const target = args.positional[1];

    if (!target) {
      context.errors.throwError(400, 'Missing directory path. Example: dev search collections add /path/to/dir --name docs', 'search');
      return;
    }

    const name = args.flags.name;
    if (!name) {
      context.errors.throwError(400, 'The --name flag is required when adding a collection.', 'search');
      return;
    }

    // Resolve to an absolute path
    const dirPath = path.resolve(target);
    if (!fs.existsSync(dirPath)) {
      context.errors.throwError(1, `Directory does not exist: ${dirPath}`, 'search');
      return;
    }

    // Build the qmd command
    let cmd = `qmd collections add "${dirPath}" --name "${name}"`;
    if (args.flags.mask) {
      cmd += ` --mask "${args.flags.mask}"`;
    }

    const result = await shell.exec(cmd);

    if (result.exitCode !== 0) {
      context.errors.throwError(1, result.stderr || 'Failed to add collection.', 'search');
      return;
    }

    context.output.info(`Collection "${name}" added: ${dirPath}`);

  } else if (action === 'remove') {
    // Remove a collection
    const name = args.positional[1];

    if (!name) {
      context.errors.throwError(400, 'Provide the collection name to remove. Example: dev search collections remove docs', 'search');
      return;
    }

    // Ask for confirmation unless --confirm is passed
    if (!args.flags.confirm) {
      const ok = await context.prompt.confirm(
        `Remove collection "${name}"?`,
        false
      );
      if (!ok) {
        context.output.info('Cancelled.');
        return;
      }
    }

    const result = await shell.exec(`qmd collections remove "${name}"`);

    if (result.exitCode !== 0) {
      context.errors.throwError(1, result.stderr || `Failed to remove collection "${name}".`, 'search');
      return;
    }

    context.output.info(`Collection "${name}" removed.`);

  } else {
    context.output.info('Usage: dev search collections <add|remove|list>');
  }
}

module.exports = { meta, run };
