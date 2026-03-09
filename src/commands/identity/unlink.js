'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Remove a folder link from an identity.',
  arguments: [
    { name: 'name', description: 'Identity name', required: true },
    { name: 'folder', description: 'Folder path to unlink', required: true },
  ],
  flags: [],
};

async function run(args, context) {
  const name = args.positional[0];
  const folder = args.positional[1];

  if (!name || !folder) {
    context.errors.throwError(400, 'Usage: dev identity unlink <name> <folder>', 'identity');
    return;
  }

  const absolutePath = path.resolve(folder);

  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  const identity = identities.find(id => id.name.toLowerCase() === name.toLowerCase());
  if (!identity) {
    context.errors.throwError(404, `Identity '${name}' not found.`, 'identity');
    return;
  }

  const folders = identity.folders || [];
  const found = folders.find(f => f.path === absolutePath);
  if (!found) {
    context.output.info(`Folder '${absolutePath}' is not linked to identity '${identity.name}'. Nothing to do.`);
    return;
  }

  identity.folders = folders.filter(f => f.path !== absolutePath);
  config.identities = identities;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');

  context.output.info(`Unlinked '${absolutePath}' from identity '${identity.name}'.`);
  context.output.info("Run 'dev identity sync' to update SSH and git config.");
}

module.exports = { meta, run };
