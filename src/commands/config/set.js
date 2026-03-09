'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Write a config value by dot-notation key.',
  arguments: [
    { name: 'key', required: true, description: 'Dot-notation path to the config value (e.g., user.email)' },
    { name: 'value', required: false, description: 'The value to set. Omit if using --json.' },
  ],
  flags: [
    { name: 'json', type: 'string', description: 'Set a structured value using a JSON string' },
  ],
};

async function run(args, context) {
  const key = args.positional[0];
  const rawValue = args.positional[1];
  const jsonValue = args.flags.json;

  if (!key) {
    context.errors.throwError(400, 'Missing required argument: <key>. Example: dev config set user.email fred@example.com', 'config');
    return;
  }

  if (!rawValue && rawValue !== '' && !jsonValue) {
    context.errors.throwError(400, 'Missing value. Provide a value or use --json for structured data.', 'config');
    return;
  }

  if (rawValue && jsonValue) {
    context.errors.throwError(400, 'Provide either a positional value or --json, not both.', 'config');
    return;
  }

  // Parse the value
  let value;
  if (jsonValue) {
    try {
      value = JSON.parse(jsonValue);
    } catch (err) {
      context.errors.throwError(400, `Invalid JSON: ${err.message}`, 'config');
      return;
    }
  } else {
    // Coerce simple types
    if (rawValue === 'true') {
      value = true;
    } else if (rawValue === 'false') {
      value = false;
    } else if (rawValue === 'null') {
      value = null;
    } else if (!isNaN(rawValue) && rawValue.trim() !== '') {
      value = Number(rawValue);
    } else {
      value = rawValue;
    }
  }

  // Read existing config
  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Run "dev config init" first.', 'config');
    return;
  }

  const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
  const config = JSON.parse(raw);

  // Set value by dot-notation key
  const parts = key.split('.');
  let target = config;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in target) || typeof target[part] !== 'object' || target[part] === null) {
      target[part] = {};
    }
    target = target[part];
  }

  const lastPart = parts[parts.length - 1];
  target[lastPart] = value;

  // Write config back
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
  context.output.out({ key: key, value: value });
}

module.exports = { meta, run };
