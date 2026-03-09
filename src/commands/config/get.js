'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Read a specific config value by dot-notation key.',
  arguments: [
    { name: 'key', required: true, description: 'Dot-notation path to the config value (e.g., user.email, defaults.license)' },
  ],
  flags: [],
};

async function run(args, context) {
  const key = args.positional[0];

  if (!key) {
    context.errors.throwError(400, 'Missing required argument: <key>. Example: dev config get user.email', 'config');
    return;
  }

  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'config');
    return;
  }

  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = JSON.parse(raw);

  // Resolve dot-notation key
  const parts = key.split('.');
  let value = config;

  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== 'object') {
      context.errors.throwError(404, `Key "${key}" not found in config.`, 'config');
      return;
    }
    if (!(part in value)) {
      context.errors.throwError(404, `Key "${key}" not found in config.`, 'config');
      return;
    }
    value = value[part];
  }

  context.output.out(value);
}

module.exports = { meta, run };
