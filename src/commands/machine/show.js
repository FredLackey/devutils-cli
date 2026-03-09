'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'Display the current machine profile.',
  arguments: [],
  flags: []
};

/**
 * Reads the current machine profile from ~/.devutils/machines/current.json
 * and displays it. If the file does not exist, tells the user to run
 * "dev machine detect" first.
 *
 * @param {object} args - Parsed command arguments (none expected).
 * @param {object} context - The CLI context object with output and errors.
 */
async function run(args, context) {
  const CURRENT_FILE = path.join(os.homedir(), '.devutils', 'machines', 'current.json');

  if (!fs.existsSync(CURRENT_FILE)) {
    context.errors.throwError(404, 'No machine profile found. Run "dev machine detect" first.', 'machine');
    return;
  }

  const raw = fs.readFileSync(CURRENT_FILE, 'utf8');
  const profile = JSON.parse(raw);

  context.output.out(profile);
}

module.exports = { meta, run };
