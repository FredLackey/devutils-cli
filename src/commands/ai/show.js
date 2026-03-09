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
  description: 'Show the current configuration for an AI tool',
  arguments: [
    { name: 'tool', description: 'AI tool name (e.g., claude, gemini)', required: true }
  ],
  flags: []
};

/**
 * Displays the current configuration for a specified AI tool.
 * Shows defaults when no configuration has been set yet.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const toolName = args.positional[0];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: <tool>. Example: dev ai show claude', 'ai');
    return;
  }

  // Validate the tool name
  const toolConfig = AI_TOOLS[toolName];
  if (!toolConfig) {
    const available = Object.keys(AI_TOOLS).join(', ');
    context.output.info(`Unknown AI tool "${toolName}". Available: ${available}`);
    return;
  }

  // Read the user's config, falling back to defaults
  const aiConfig = readAiConfig();
  const config = aiConfig[toolName] || {};

  const result = {
    tool: toolName,
    displayName: toolConfig.displayName,
    binary: toolConfig.binary,
    installed: shell.commandExists(toolConfig.binary),
    mode: config.mode || 'default',
    model: config.model || '(not set)',
    flags: config.flags || [],
    availableModes: Object.keys(toolConfig.modes)
  };

  context.output.out(result);
}

module.exports = { meta, run };
