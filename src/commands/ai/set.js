'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
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

const VALID_KEYS = ['mode', 'model', 'flags'];

const meta = {
  description: 'Set a default configuration value for an AI tool',
  arguments: [
    { name: 'tool', description: 'AI tool name (e.g., claude, gemini)', required: true },
    { name: 'key', description: 'Configuration key to set (mode, model, flags)', required: true },
    { name: 'value', description: 'Value to set', required: true }
  ],
  flags: []
};

/**
 * Sets a default configuration value for a specified AI tool.
 * Validates the tool name, key, and value before writing to ai.json.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const toolName = args.positional[0];
  const key = args.positional[1];
  const rawValue = args.positional[2];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: <tool>. Example: dev ai set claude mode danger', 'ai');
    return;
  }

  if (!key) {
    context.errors.throwError(400, 'Missing required argument: <key>. Example: dev ai set claude mode danger', 'ai');
    return;
  }

  if (rawValue === undefined || rawValue === null) {
    context.errors.throwError(400, 'Missing required argument: <value>. Example: dev ai set claude mode danger', 'ai');
    return;
  }

  // Validate the tool name
  const toolConfig = AI_TOOLS[toolName];
  if (!toolConfig) {
    const available = Object.keys(AI_TOOLS).join(', ');
    context.output.info(`Unknown AI tool "${toolName}". Available: ${available}`);
    return;
  }

  // Validate the key
  if (!VALID_KEYS.includes(key)) {
    context.output.info(`Unknown configuration key "${key}". Valid keys: ${VALID_KEYS.join(', ')}`);
    return;
  }

  // Validate and parse the value based on the key
  let parsedValue;

  if (key === 'mode') {
    // Mode must be one of the tool's known modes
    const availableModes = Object.keys(toolConfig.modes);
    if (!availableModes.includes(rawValue)) {
      context.output.info(
        `Unknown mode "${rawValue}" for ${toolConfig.displayName}. Available modes: ${availableModes.join(', ')}`
      );
      return;
    }
    parsedValue = rawValue;
  } else if (key === 'model') {
    // "none" or "null" clears the model
    if (rawValue === 'none' || rawValue === 'null') {
      parsedValue = null;
    } else {
      parsedValue = rawValue;
    }
  } else if (key === 'flags') {
    // Parse as a comma-separated list, trim whitespace, reject empty strings
    parsedValue = rawValue
      .split(',')
      .map(flag => flag.trim())
      .filter(flag => flag.length > 0);
  }

  // Read the current config (or start fresh)
  const aiConfig = readAiConfig();
  if (!aiConfig[toolName]) {
    aiConfig[toolName] = {};
  }
  aiConfig[toolName][key] = parsedValue;

  // Ensure the parent directory exists
  const configDir = path.dirname(AI_CONFIG_FILE);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Write the updated config
  fs.writeFileSync(AI_CONFIG_FILE, JSON.stringify(aiConfig, null, 2) + '\n');

  // Print confirmation
  if (key === 'model' && parsedValue === null) {
    context.output.info(`Set ${toolName}.${key} = (cleared)`);
  } else if (key === 'flags') {
    context.output.info(`Set ${toolName}.${key} = ${JSON.stringify(parsedValue)}`);
  } else {
    context.output.info(`Set ${toolName}.${key} = ${parsedValue}`);
  }
}

module.exports = { meta, run };
