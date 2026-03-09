'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Show details of a specific identity.',
  arguments: [
    { name: 'name', description: 'Name of the identity to show', required: true },
  ],
  flags: [],
};

async function run(args, context) {
  const name = args.positional[0];
  if (!name) {
    context.errors.throwError(400, 'Missing identity name. Usage: dev identity show <name>', 'identity');
    return;
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  const identity = identities.find(id => id.name.toLowerCase() === name.toLowerCase());
  if (!identity) {
    context.errors.throwError(404, `Identity '${name}' not found. Run 'dev identity list' to see available identities.`, 'identity');
    return;
  }

  // For JSON callers, output the raw object
  if (context.flags.format === 'json') {
    context.output.out(identity);
    return;
  }

  // Formatted display for humans
  const sshStatus = identity.sshKey
    ? `${identity.sshKey} ${fs.existsSync(identity.sshKey) ? '(exists)' : '(missing!)'}`
    : '(not configured)';
  const gpgStatus = identity.gpgKey || '(not configured)';
  const folders = identity.folders || [];

  context.output.info(`Identity: ${identity.name}`);
  context.output.info('');
  context.output.info(`  Email:         ${identity.email}`);
  context.output.info(`  SSH Key:       ${sshStatus}`);
  context.output.info(`  GPG Key:       ${gpgStatus}`);
  context.output.info(`  Linked Folders (${folders.length}):`);
  if (folders.length === 0) {
    context.output.info('    (none)');
  } else {
    for (const f of folders) {
      context.output.info(`    ${f.path || f}`);
    }
  }
}

module.exports = { meta, run };
