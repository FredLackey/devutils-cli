'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_FILE = path.join(os.homedir(), '.devutils', 'config.json');

const meta = {
  description: 'Reset configuration to defaults. Clears user info and restores default settings.',
  arguments: [],
  flags: [
    { name: 'confirm', type: 'boolean', description: 'Skip the confirmation prompt' },
  ],
};

async function run(args, context) {
  if (!fs.existsSync(CONFIG_FILE)) {
    context.errors.throwError(404, 'Config not found. Nothing to reset.', 'config');
    return;
  }

  // Ask for confirmation unless --confirm is passed
  if (!args.flags.confirm) {
    const proceed = await context.prompt.confirm(
      'This will reset all configuration to defaults. Your user info will be cleared. Continue?',
      false
    );
    if (!proceed) {
      context.output.info('Reset cancelled.');
      return;
    }
  }

  // Write default config
  const defaults = {
    user: {
      name: '',
      email: '',
      url: '',
    },
    defaults: {
      license: 'MIT',
      packageManager: 'npm',
    },
    backup: {
      backend: null,
      location: null,
    },
    profile: 'default',
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaults, null, 2) + '\n');
  context.output.info('Configuration reset to defaults.');
}

module.exports = { meta, run };
