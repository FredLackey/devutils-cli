'use strict';

const shell = require('../../lib/shell');
const { AI_TOOLS } = require('./tools');

const meta = {
  description: 'Resume a previous AI coding session by ID',
  arguments: [
    { name: 'tool', description: 'AI tool to resume (e.g., claude, gemini)', required: true },
    { name: 'session', description: 'Session ID to resume', required: true }
  ],
  flags: []
};

/**
 * Resumes a previous AI coding session by session ID.
 * Validates the tool name, checks the binary is installed,
 * and spawns the tool with the resume flag and session ID.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags, extra }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const toolName = args.positional[0];
  const sessionId = args.positional[1];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: <tool>. Example: dev ai resume claude abc123', 'ai');
    return;
  }

  if (!sessionId) {
    context.errors.throwError(400, 'Missing required argument: <session>. Example: dev ai resume claude abc123', 'ai');
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

  // Build the command
  const parts = [
    toolConfig.binary,
    toolConfig.resumeFlag,
    sessionId
  ];

  // Pass through extra flags
  if (args.extra && args.extra.length > 0) {
    parts.push(...args.extra);
  }

  const command = parts.join(' ');
  context.output.info(`Resuming ${toolConfig.displayName} session ${sessionId}...`);
  await shell.exec(command, { stdio: 'inherit' });
}

module.exports = { meta, run };
