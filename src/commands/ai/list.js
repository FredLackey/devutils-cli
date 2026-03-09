'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const shell = require('../../lib/shell');
const { AI_TOOLS } = require('./tools');

const AI_CONFIG_FILE = path.join(os.homedir(), '.devutils', 'ai.json');

/**
 * Reads ~/.devutils/ai.json and returns its contents.
 * Returns an empty object if the file does not exist or is unreadable.
 *
 * @returns {object} The parsed AI config, or {}.
 */
function readAiConfig() {
  try {
    return JSON.parse(fs.readFileSync(AI_CONFIG_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

const meta = {
  description: 'List available AI coding tools and their install status',
  arguments: [],
  flags: []
};

/**
 * Lists all known AI coding tools with their install status,
 * current mode, and available modes.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output }.
 */
async function run(args, context) {
  const aiConfig = readAiConfig();

  const results = Object.entries(AI_TOOLS).map(([name, tool]) => ({
    name: name,
    displayName: tool.displayName,
    binary: tool.binary,
    installed: shell.commandExists(tool.binary),
    configured: !!aiConfig[name],
    mode: (aiConfig[name] && aiConfig[name].mode) || 'default',
    availableModes: Object.keys(tool.modes)
  }));

  context.output.out(results);
}

module.exports = { meta, run };
