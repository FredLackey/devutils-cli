'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const meta = {
  description: 'List all known machine profiles.',
  arguments: [],
  flags: []
};

/**
 * Lists all machine profiles stored in ~/.devutils/machines/.
 * Reads every .json file in the directory and builds a summary for each,
 * including hostname, OS, architecture, and detection timestamp.
 * The current machine (current.json) is marked in the output.
 *
 * Right now this will only show the local machine. When backup/sync is
 * built, profiles from other computers will also appear here.
 *
 * @param {object} args - Parsed command arguments (none expected).
 * @param {object} context - The CLI context object with output and errors.
 */
async function run(args, context) {
  const MACHINES_DIR = path.join(os.homedir(), '.devutils', 'machines');

  // Check if the machines directory exists
  if (!fs.existsSync(MACHINES_DIR)) {
    context.errors.throwError(404, 'No machine profiles found. Run "dev machine detect" first.', 'machine');
    return;
  }

  // Find all JSON files in the machines directory
  const files = fs.readdirSync(MACHINES_DIR).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    context.errors.throwError(404, 'No machine profiles found. Run "dev machine detect" first.', 'machine');
    return;
  }

  // Load each profile and build a summary
  const machines = [];

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(MACHINES_DIR, file), 'utf8');
      const profile = JSON.parse(raw);

      machines.push({
        file: file,
        current: file === 'current.json',
        hostname: profile.hostname || 'unknown',
        os: profile.os ? `${profile.os.name} ${profile.os.version}` : 'unknown',
        arch: profile.arch || 'unknown',
        detectedAt: profile.detectedAt || 'unknown'
      });
    } catch (err) {
      // Don't crash on corrupted files — show them as error entries
      machines.push({
        file: file,
        current: file === 'current.json',
        hostname: 'error',
        os: `Failed to read: ${err.message}`,
        arch: 'unknown',
        detectedAt: 'unknown'
      });
    }
  }

  context.output.out(machines);
}

module.exports = { meta, run };
