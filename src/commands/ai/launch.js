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
  description: 'Start an AI coding tool with configured defaults',
  arguments: [
    { name: 'tool', description: 'AI tool to launch (e.g., claude, gemini)', required: true }
  ],
  flags: [
    { name: 'mode', type: 'string', description: 'Override the launch mode (e.g., danger, yolo, default)' },
    { name: 'model', type: 'string', description: 'Override the model selection' },
    { name: 'prompt', type: 'string', description: 'Pass an initial prompt to the AI tool' }
  ]
};

/**
 * Launches an AI coding tool with configured defaults.
 * Reads user preferences from ai.json, builds the command with
 * mode/model/flags, and spawns the tool with stdio inherit.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags, extra }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const toolName = args.positional[0];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: <tool>. Example: dev ai launch claude', 'ai');
    return;
  }

  // Validate the tool name
  const toolConfig = AI_TOOLS[toolName];
  if (!toolConfig) {
    const available = Object.keys(AI_TOOLS).join(', ');
    context.output.info(`Unknown AI tool "${toolName}". Available: ${available}`);
    return;
  }

  // Check that the tool is installed
  const isInstalled = shell.commandExists(toolConfig.binary);
  if (!isInstalled) {
    context.output.info(`${toolConfig.displayName} is not installed.`);
    context.output.info(`Install it and make sure "${toolConfig.binary}" is on your PATH.`);
    return;
  }

  // Read user configuration
  const aiConfig = readAiConfig();
  const toolUserConfig = aiConfig[toolName] || {};

  // Build the command
  const parts = [toolConfig.binary];

  // Determine mode: command-line flag overrides config, config overrides default
  const mode = args.flags.mode || toolUserConfig.mode || 'default';
  const modeFlags = toolConfig.modes[mode];
  if (!modeFlags) {
    const available = Object.keys(toolConfig.modes).join(', ');
    context.output.info(`Unknown mode "${mode}" for ${toolConfig.displayName}. Available: ${available}`);
    return;
  }
  parts.push(...modeFlags);

  // Model flag
  const model = args.flags.model || toolUserConfig.model;
  if (model) {
    parts.push(toolConfig.modelFlag, model);
  }

  // Prompt flag
  if (args.flags.prompt) {
    parts.push(toolConfig.promptFlag, JSON.stringify(args.flags.prompt));
  }

  // User's default flags from config
  if (toolUserConfig.flags && toolUserConfig.flags.length > 0) {
    parts.push(...toolUserConfig.flags);
  }

  // Pass through any remaining unrecognized flags from the command line
  if (args.extra && args.extra.length > 0) {
    parts.push(...args.extra);
  }

  const command = parts.join(' ');
  context.output.info(`Launching ${toolConfig.displayName}...`);
  await shell.exec(command, { stdio: 'inherit' });
}

module.exports = { meta, run };
