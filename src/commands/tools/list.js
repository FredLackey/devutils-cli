'use strict';

/**
 * Command: dev tools list
 *
 * Lists all available tools from the registry, with their install status.
 * Can filter by --installed, --available, or --platform.
 */

/**
 * @type {{ description: string, arguments: Array, flags: Array }}
 */
const meta = {
  description: 'List available tools',
  arguments: [],
  flags: [
    { name: '--installed', description: 'Show only installed tools' },
    { name: '--available', description: 'Show only tools not yet installed' },
    { name: '--platform', description: 'Filter by platform (default: current)' }
  ]
};

/**
 * Runs the list command.
 * @param {{ positional: string[], flags: object }} args - Parsed command arguments.
 * @param {object} context - The CLI context object.
 */
async function run(args, context) {
  const installer = require('../../lib/installer');

  // Load the full registry
  const tools = installer.loadRegistry();

  // Determine platform filter
  const platformFilter = args.flags.platform || context.platform.detect().type;

  // Filter to tools that support the target platform
  let filtered = tools.filter(t => t.platforms.includes(platformFilter));

  // If --installed or --available, check each tool's install status
  const showInstalled = args.flags.installed === true;
  const showAvailable = args.flags.available === true;

  if (showInstalled || showAvailable) {
    const statusResults = [];
    for (const tool of filtered) {
      try {
        const mod = installer.loadInstaller(tool);
        const isInst = await mod.isInstalled(context);
        statusResults.push({ tool, installed: isInst });
      } catch {
        // If the installer can't be loaded, treat as not installed
        statusResults.push({ tool, installed: false });
      }
    }

    if (showInstalled) {
      filtered = statusResults.filter(r => r.installed).map(r => r.tool);
    } else {
      filtered = statusResults.filter(r => !r.installed).map(r => r.tool);
    }
  }

  if (filtered.length === 0) {
    context.output.info('No tools match the current filters.');
    return;
  }

  // Build output rows with install status
  const rows = [];
  for (const tool of filtered) {
    let status = '-';
    try {
      const mod = installer.loadInstaller(tool);
      const isInst = await mod.isInstalled(context);
      status = isInst ? 'yes' : 'no';
    } catch {
      status = '?';
    }

    rows.push({
      Name: tool.name,
      Description: tool.description,
      Installed: status,
    });
  }

  context.output.out(rows);
}

module.exports = { meta, run };
