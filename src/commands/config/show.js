'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Display the current configuration.',
  arguments: [],
  flags: [
    { name: 'profile', type: 'string', description: 'Show a specific profile instead of the active one' },
  ],
};

async function run(args, context) {
  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'config');
    return;
  }

  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = JSON.parse(raw);

  // Handle --profile flag
  if (args.flags.profile && args.flags.profile !== config.profile) {
    context.errors.throwError(404, `Profile "${args.flags.profile}" not found. Current profile is "${config.profile}".`, 'config');
    return;
  }

  context.output.out(config);
}

module.exports = { meta, run };
