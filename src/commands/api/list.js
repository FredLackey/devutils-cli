'use strict';

const loader = require('../../api/loader');

const meta = {
  description: 'List installed and available API plugins',
  arguments: [],
  flags: [
    { name: 'installed', type: 'boolean', description: 'Show only installed plugins' },
    { name: 'available', type: 'boolean', description: 'Show only available (not installed) plugins' }
  ]
};

/**
 * Lists installed and/or available API plugins.
 * Shows both by default, or filters with --installed / --available flags.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const installed = loader.getInstalledPlugins();
  const registry = loader.getRegistryPlugins();
  const installedNames = Object.keys(installed);

  // Build the installed list
  const installedList = installedNames.map(name => ({
    name,
    package: installed[name].package,
    version: installed[name].version || 'unknown',
    source: installed[name].source || 'npm',
    installedAt: installed[name].installedAt || ''
  }));

  // Build the available list (registry entries that are not installed)
  const availableList = registry
    .filter(entry => !installed[entry.name])
    .map(entry => ({
      name: entry.name,
      package: entry.package,
      description: entry.description
    }));

  // Apply filters
  const showInstalled = args.flags.installed || !args.flags.available;
  const showAvailable = args.flags.available || !args.flags.installed;

  const result = {};

  if (showInstalled) {
    result.installed = installedList;
  }
  if (showAvailable) {
    result.available = availableList;
  }

  // If only installed was requested and nothing is installed, give a hint
  if (args.flags.installed && installedList.length === 0) {
    context.output.info('No API plugins installed. Run "dev api enable <name>" to install one.');
    return;
  }

  context.output.out(result);
}

module.exports = { meta, run };
