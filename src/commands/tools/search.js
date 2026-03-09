'use strict';

/**
 * Command: dev tools search <query>
 *
 * Searches for tools by name or keyword in the registry.
 * Matches against tool name and description (case-insensitive).
 */

/**
 * @type {{ description: string, arguments: Array, flags: Array }}
 */
const meta = {
  description: 'Search for tools by name or keyword',
  arguments: [
    { name: 'query', description: 'Search term (matches name and description)', required: true }
  ],
  flags: []
};

/**
 * Runs the search command.
 * @param {{ positional: string[], flags: object }} args - Parsed command arguments.
 * @param {object} context - The CLI context object.
 */
async function run(args, context) {
  const query = args.positional[0];

  if (!query) {
    context.errors.throwError(400, 'Missing required argument: query. Usage: dev tools search <query>', 'tools');
    return;
  }

  const installer = require('../../lib/installer');

  // Load the registry and search
  const tools = installer.loadRegistry();
  const lower = query.toLowerCase();

  const matches = tools.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower)
  );

  if (matches.length === 0) {
    context.output.info(`No tools found matching '${query}'.`);
    return;
  }

  // Format as table with name, description, and platforms
  const rows = matches.map(t => ({
    Name: t.name,
    Description: t.description,
    Platforms: t.platforms.join(', '),
  }));

  context.output.out(rows);
}

module.exports = { meta, run };
