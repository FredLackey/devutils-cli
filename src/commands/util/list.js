'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'List available utilities. Use flags to filter by source.',
  arguments: [],
  flags: [
    { name: 'built-in', description: 'Show only built-in utilities' },
    { name: 'custom', description: 'Show only user-added utilities' },
  ],
};

/**
 * Load custom utilities from ~/.devutils/utils/.
 * Checks for a registry.json first; falls back to scanning directories.
 *
 * @returns {Array<object>} Array of utility metadata objects.
 */
function loadCustomUtilities() {
  const customDir = path.join(os.homedir(), '.devutils', 'utils');
  if (!fs.existsSync(customDir)) {
    return [];
  }

  const registryPath = path.join(customDir, 'registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      return (data.utilities || []).map(u => ({ ...u, type: 'custom' }));
    } catch {
      // Fall through to directory scan
    }
  }

  // Fallback: scan directories for index.js with meta exports
  const entries = fs.readdirSync(customDir, { withFileTypes: true });
  const utilities = [];

  for (const entry of entries) {
    if (entry.name === 'registry.json') continue;

    let indexPath;
    if (entry.isDirectory()) {
      indexPath = path.join(customDir, entry.name, 'index.js');
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      indexPath = path.join(customDir, entry.name);
    }

    if (indexPath && fs.existsSync(indexPath)) {
      try {
        const mod = require(indexPath);
        if (mod.meta) {
          utilities.push({
            name: mod.meta.name || entry.name.replace(/\.js$/, ''),
            description: mod.meta.description || '',
            type: 'custom',
          });
        }
      } catch {
        // Skip utilities that fail to load
      }
    }
  }

  return utilities;
}

async function run(args, context) {
  const builtInRegistry = require('../../utils/registry.json');
  const results = [];

  if (!args.flags.custom) {
    for (const util of builtInRegistry.utilities || []) {
      results.push({ Name: util.name, Description: util.description, Type: 'built-in' });
    }
  }

  if (!args.flags['built-in']) {
    const custom = loadCustomUtilities();
    for (const util of custom) {
      results.push({ Name: util.name, Description: util.description || '', Type: 'custom' });
    }
  }

  if (results.length === 0) {
    context.output.info('No utilities found.');
    return;
  }

  context.output.out(results);
  context.output.info(`\n${results.length} ${results.length === 1 ? 'utility' : 'utilities'} available.`);
}

module.exports = { meta, run };
