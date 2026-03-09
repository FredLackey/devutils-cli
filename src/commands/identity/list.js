'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'List all configured identities.',
  arguments: [],
  flags: [],
};

async function run(args, context) {
  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'identity');
    return;
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  const identities = config.identities || [];

  if (identities.length === 0) {
    context.output.info('No identities configured.');
    context.output.info('');
    context.output.info('Create one with:');
    context.output.info('  dev identity add <name> --email <email>');
    context.output.info('');
    context.output.info('Example:');
    context.output.info('  dev identity add personal --email fred@example.com');
    return;
  }

  // Build table rows
  const rows = identities.map(id => ({
    Name: id.name,
    Email: id.email,
    'SSH Key': id.sshKey ? 'yes' : 'no',
    'GPG Key': id.gpgKey ? 'yes' : 'no',
    'Linked Folders': (id.folders || []).length,
  }));

  context.output.out(rows);
  const count = identities.length;
  context.output.info(`\n${count} ${count === 1 ? 'identity' : 'identities'} configured.`);
}

module.exports = { meta, run };
