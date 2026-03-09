'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Remove an identity profile.',
  arguments: [
    { name: 'name', description: 'Name of the identity to remove', required: true },
  ],
  flags: [
    { name: 'confirm', description: 'Skip the confirmation prompt' },
    { name: 'force', description: 'Remove even if the identity has linked folders' },
  ],
};

async function run(args, context) {
  const name = args.positional[0];
  if (!name) {
    context.errors.throwError(400, 'Missing identity name. Usage: dev identity remove <name>', 'identity');
    return;
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  // Find the identity
  const identity = identities.find(id => id.name.toLowerCase() === name.toLowerCase());
  if (!identity) {
    context.errors.throwError(404, `Identity '${name}' not found.`, 'identity');
    return;
  }

  // Check for linked folders
  const folders = identity.folders || [];
  if (folders.length > 0 && !args.flags.force) {
    const folderList = folders.map(f => `  ${f.path || f}`).join('\n');
    context.errors.throwError(
      400,
      `Cannot remove identity '${identity.name}' because it has ${folders.length} linked folder(s):\n${folderList}\nUse --force to remove anyway, or unlink the folders first.`,
      'identity'
    );
    return;
  }

  // Confirm
  if (!args.flags.confirm) {
    const proceed = await context.prompt.confirm(`Remove identity '${identity.name}'? This cannot be undone.`, false);
    if (!proceed) {
      context.output.info('Cancelled.');
      return;
    }
  }

  // Remove from array
  config.identities = identities.filter(id => id.name.toLowerCase() !== name.toLowerCase());
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');

  context.output.info(`Identity '${identity.name}' removed.`);
  if (identity.sshKey) {
    context.output.info(`Note: SSH key at ${identity.sshKey} was not deleted. Remove it manually if no longer needed.`);
  }
}

module.exports = { meta, run };
