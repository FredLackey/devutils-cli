'use strict';

const fs = require('fs');
const shell = require('../../lib/shell');
const loader = require('../../api/loader');

const meta = {
  description: 'Remove an installed API plugin',
  arguments: [
    { name: 'name', description: 'Plugin name to remove', required: true }
  ],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip confirmation prompt' }
  ]
};

/**
 * Removes an installed API plugin.
 * Runs npm uninstall, removes the entry from plugins.json,
 * and asks for confirmation unless --confirm is passed.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors, prompt }.
 */
async function run(args, context) {
  const pluginName = args.positional[0];

  if (!pluginName) {
    context.errors.throwError(400, 'Missing required argument: <name>. Example: dev api disable gmail', 'api');
    return;
  }

  // Check if the plugin is installed
  const plugins = loader.readPluginsJson();
  const entry = plugins[pluginName];

  if (!entry) {
    context.output.info(`Plugin "${pluginName}" is not installed.`);
    return;
  }

  // Ask for confirmation unless --confirm is passed
  if (!args.flags.confirm) {
    const ok = await context.prompt.confirm(
      `Remove plugin "${pluginName}" (${entry.package})?`,
      false
    );
    if (!ok) {
      context.output.info('Cancelled.');
      return;
    }
  }

  // Run npm uninstall
  const result = await shell.exec(`npm uninstall ${entry.package}`, { cwd: loader.PLUGINS_DIR });

  if (result.exitCode !== 0) {
    context.errors.throwError(
      500,
      `Failed to uninstall plugin "${pluginName}".\n${result.stderr || result.stdout}`,
      'api'
    );
    return;
  }

  // Remove the entry from plugins.json
  delete plugins[pluginName];
  fs.writeFileSync(loader.PLUGINS_FILE, JSON.stringify(plugins, null, 2) + '\n');

  context.output.info(`Plugin "${pluginName}" removed.`);
}

module.exports = { meta, run };
