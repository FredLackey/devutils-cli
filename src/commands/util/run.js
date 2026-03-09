'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const builtInDir = path.join(__dirname, '..', '..', 'utils');
const customDir = path.join(os.homedir(), '.devutils', 'utils');

const meta = {
  description: 'Execute a utility by name. Extra arguments are passed through to the utility.',
  arguments: [
    { name: 'name', required: true, description: 'Name of the utility to run' },
  ],
  flags: [],
};

/**
 * Find a utility by name, checking built-in first, then custom.
 * Supports both folder-based (name/index.js) and single-file (name.js) utilities.
 *
 * @param {string} name - The utility name.
 * @returns {{ path: string, type: string }|null} The utility location, or null if not found.
 */
function findUtility(name) {
  // Check built-in: folder with index.js
  const builtInFolder = path.join(builtInDir, name, 'index.js');
  if (fs.existsSync(builtInFolder)) {
    return { path: builtInFolder, type: 'built-in' };
  }

  // Check built-in: single file
  const builtInFile = path.join(builtInDir, name + '.js');
  if (fs.existsSync(builtInFile)) {
    return { path: builtInFile, type: 'built-in' };
  }

  // Check custom: folder with index.js
  const customFolder = path.join(customDir, name, 'index.js');
  if (fs.existsSync(customFolder)) {
    return { path: customFolder, type: 'custom' };
  }

  // Check custom: single file
  const customFile = path.join(customDir, name + '.js');
  if (fs.existsSync(customFile)) {
    return { path: customFile, type: 'custom' };
  }

  return null;
}

async function run(args, context) {
  const name = args.positional[0];
  if (!name) {
    context.errors.throwError(400, 'Usage: dev util run <name> [args...]', 'util');
    return;
  }

  const utilArgs = args.positional.slice(1);

  const util = findUtility(name);
  if (!util) {
    context.output.error(`Utility "${name}" not found.`);
    context.output.info('Run "dev util list" to see available utilities.');
    return;
  }

  const utilModule = require(util.path);

  if (typeof utilModule.run !== 'function') {
    context.output.error(`Utility "${name}" does not export a run() function.`);
    return;
  }

  await utilModule.run(utilArgs, context);
}

module.exports = { meta, run, findUtility };
