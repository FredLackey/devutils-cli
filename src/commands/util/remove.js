'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'Unregister a custom utility. Built-in utilities cannot be removed.',
  arguments: [
    { name: 'name', required: true, description: 'Name of the custom utility to remove' },
  ],
  flags: [
    { name: 'confirm', description: 'Skip the confirmation prompt' },
  ],
};

async function run(args, context) {
  const name = args.positional[0];
  if (!name) {
    context.errors.throwError(400, 'Usage: dev util remove <name>', 'util');
    return;
  }

  // Reject removal of built-in utilities
  const builtInRegistry = require('../../utils/registry.json');
  const isBuiltIn = (builtInRegistry.utilities || []).some(u => u.name === name);
  if (isBuiltIn) {
    context.output.error(`"${name}" is a built-in utility and cannot be removed.`);
    return;
  }

  const customDir = path.join(os.homedir(), '.devutils', 'utils');
  const folderPath = path.join(customDir, name);
  const filePath = path.join(customDir, name + '.js');

  const exists = fs.existsSync(folderPath) || fs.existsSync(filePath);
  if (!exists) {
    context.output.error(`Custom utility "${name}" not found.`);
    return;
  }

  // Ask for confirmation unless --confirm is set
  if (!args.flags.confirm) {
    const ok = await context.prompt.confirm(
      `Remove custom utility "${name}"? This will delete the files.`,
      false
    );
    if (!ok) {
      context.output.info('Cancelled.');
      return;
    }
  }

  // Delete the files
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  } else if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Update the custom registry
  const registryPath = path.join(customDir, 'registry.json');
  if (fs.existsSync(registryPath)) {
    try {
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      registry.utilities = (registry.utilities || []).filter(u => u.name !== name);
      fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');
    } catch {
      // Registry corrupted, skip update
    }
  }

  context.output.info(`Utility "${name}" removed.`);
}

module.exports = { meta, run };
