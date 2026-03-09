'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Link an identity to a folder path.',
  arguments: [
    { name: 'name', description: 'Identity name', required: true },
    { name: 'folder', description: 'Folder path to link (absolute or relative)', required: true },
  ],
  flags: [
    { name: 'remote', description: 'Git remote hostname (default: github.com)' },
  ],
};

async function run(args, context) {
  const name = args.positional[0];
  const folder = args.positional[1];

  if (!name || !folder) {
    context.errors.throwError(400, 'Usage: dev identity link <name> <folder> [--remote <host>]', 'identity');
    return;
  }

  const absolutePath = path.resolve(folder);
  if (!fs.existsSync(absolutePath)) {
    context.errors.throwError(404, `Folder not found: ${absolutePath}`, 'identity');
    return;
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  // Find the target identity
  const identity = identities.find(id => id.name.toLowerCase() === name.toLowerCase());
  if (!identity) {
    context.errors.throwError(404, `Identity '${name}' not found.`, 'identity');
    return;
  }

  const remote = args.flags.remote || 'github.com';

  // Check if folder is linked to a different identity
  for (const id of identities) {
    const existing = (id.folders || []).find(f => f.path === absolutePath);
    if (existing && id.name.toLowerCase() !== name.toLowerCase()) {
      context.output.info(`Warning: Folder '${absolutePath}' is currently linked to identity '${id.name}'. Re-linking to '${identity.name}'.`);
    }
  }

  // Remove folder from all identities (avoid duplicates)
  for (const id of identities) {
    id.folders = (id.folders || []).filter(f => f.path !== absolutePath);
  }

  // Add the link
  identity.folders = identity.folders || [];
  identity.folders.push({ path: absolutePath, remote });

  // Save
  config.identities = identities;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');

  context.output.info(`Linked '${absolutePath}' to identity '${identity.name}' (remote: ${remote}).`);
  context.output.info("Run 'dev identity sync' to apply changes to SSH and git config.");
}

module.exports = { meta, run };
