'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'Set a value in the current machine profile.',
  arguments: [
    { name: 'key', required: true, description: 'Dot-notation path to the value (e.g., nickname, os.version)' },
    { name: 'value', required: false, description: 'The value to set. Omit if using --json.' }
  ],
  flags: [
    { name: 'json', type: 'string', description: 'Set a structured value using a JSON string' }
  ]
};

/**
 * Updates a single value in the current machine profile by dot-notation key.
 * Reads ~/.devutils/machines/current.json, sets the value at the given path,
 * and writes the file back. Preserves all other existing fields.
 *
 * Supports type coercion for simple values: "true"/"false" become booleans,
 * "null" becomes null, numeric strings become numbers. Use --json for
 * structured values like arrays or objects.
 *
 * @param {object} args - Parsed command arguments with positional[0]=key, positional[1]=value.
 * @param {object} context - The CLI context object with output and errors.
 */
async function run(args, context) {
  const key = args.positional[0];
  const rawValue = args.positional[1];
  const jsonValue = args.flags.json;

  // Validate required arguments
  if (!key) {
    context.errors.throwError(400, 'Missing required argument: <key>. Example: dev machine set nickname "my-laptop"', 'machine');
    return;
  }

  if (!rawValue && rawValue !== '' && !jsonValue) {
    context.errors.throwError(400, 'Missing value. Provide a value or use --json for structured data.', 'machine');
    return;
  }

  if (rawValue && jsonValue) {
    context.errors.throwError(400, 'Provide either a positional value or --json, not both.', 'machine');
    return;
  }

  // Parse the value with type coercion
  let value;

  if (jsonValue) {
    try {
      value = JSON.parse(jsonValue);
    } catch (err) {
      context.errors.throwError(400, `Invalid JSON: ${err.message}`, 'machine');
      return;
    }
  } else {
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

  // Read the existing machine profile
  const CURRENT_FILE = path.join(os.homedir(), '.devutils', 'machines', 'current.json');

  if (!fs.existsSync(CURRENT_FILE)) {
    context.errors.throwError(404, 'No machine profile found. Run "dev machine detect" first.', 'machine');
    return;
  }

  const raw = fs.readFileSync(CURRENT_FILE, 'utf8');
  const profile = JSON.parse(raw);

  // Walk the dot-notation path and set the value
  const parts = key.split('.');
  let target = profile;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in target) || typeof target[part] !== 'object' || target[part] === null) {
      target[part] = {};
    }
    target = target[part];
  }

  const lastPart = parts[parts.length - 1];
  target[lastPart] = value;

  // Write the updated profile back to disk
  fs.writeFileSync(CURRENT_FILE, JSON.stringify(profile, null, 2) + '\n');
  context.output.out({ key: key, value: value });
}

module.exports = { meta, run };
