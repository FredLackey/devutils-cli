'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('../../lib/shell');
const loader = require('../../api/loader');

const meta = {
  description: 'Update an installed API plugin to the latest version',
  arguments: [
    { name: 'name', description: 'Plugin name to update', required: true }
  ],
  flags: []
};

/**
 * Updates an installed API plugin to the latest version.
 * For npm-sourced plugins, runs npm update. For git-sourced plugins,
 * re-runs npm install with the original git URL.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const pluginName = args.positional[0];

  if (!pluginName) {
    context.errors.throwError(400, 'Missing required argument: <name>. Example: dev api update gmail', 'api');
    return;
  }

  // Check if the plugin is installed
  const plugins = loader.readPluginsJson();
  const entry = plugins[pluginName];

  if (!entry) {
    context.output.info(`Plugin "${pluginName}" is not installed.`);
    return;
  }

  const previousVersion = entry.version || 'unknown';
  const pluginsDir = loader.PLUGINS_DIR;

  // Determine update strategy based on source type
  let result;
  if (entry.source === 'git' && entry.url) {
    // Git-sourced plugins: re-install from the original URL
    context.output.info(`Updating ${pluginName} from git...`);
    result = await shell.exec(`npm install ${entry.url}`, { cwd: pluginsDir });
  } else {
    // npm-sourced plugins: use npm update
    context.output.info(`Updating ${pluginName}...`);
    result = await shell.exec(`npm update ${entry.package}`, { cwd: pluginsDir });
  }

  if (result.exitCode !== 0) {
    context.errors.throwError(
      500,
      `Failed to update plugin "${pluginName}".\n${result.stderr || result.stdout}`,
      'api'
    );
    return;
  }

  // Read the new version from the plugin's package.json
  let newVersion = 'unknown';
  try {
    const pluginPkgPath = path.join(pluginsDir, 'node_modules', entry.package, 'package.json');
    const pluginPkg = JSON.parse(fs.readFileSync(pluginPkgPath, 'utf8'));
    newVersion = pluginPkg.version || 'unknown';
  } catch (err) {
    // Could not read version
  }

  // Update the version in plugins.json
  plugins[pluginName].version = newVersion;
  fs.writeFileSync(loader.PLUGINS_FILE, JSON.stringify(plugins, null, 2) + '\n');

  // Report the result
  if (newVersion !== previousVersion) {
    context.output.info(`Updated ${pluginName} from ${previousVersion} to ${newVersion}.`);
  } else {
    context.output.info(`${pluginName} is already at the latest version (${newVersion}).`);
  }
}

module.exports = { meta, run };
