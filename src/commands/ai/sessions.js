'use strict';

const fs = require('fs');
const path = require('path');
const shell = require('../../lib/shell');
const { AI_TOOLS } = require('./tools');

const meta = {
  description: 'List recent sessions for an AI tool',
  arguments: [
    { name: 'tool', description: 'AI tool name (e.g., claude, gemini)', required: true }
  ],
  flags: [
    { name: 'limit', type: 'number', description: 'Maximum number of sessions to show (default: 10)' }
  ]
};

/**
 * Scans a directory recursively for session files and returns metadata.
 * Wraps all file operations in try/catch to handle unreadable files gracefully.
 *
 * @param {string} dirPath - The directory to scan.
 * @param {string} toolName - The tool name (for building resume commands).
 * @returns {Array<object>} An array of session objects sorted by last-modified date.
 */
function findSessions(dirPath, toolName) {
  const sessions = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          // Recurse into subdirectories (e.g., project-specific directories)
          const nested = findSessions(fullPath, toolName);
          sessions.push(...nested);
        } else if (entry.isFile()) {
          // Extract session ID from filename (strip extension)
          const sessionId = path.basename(entry.name, path.extname(entry.name));
          const stats = fs.statSync(fullPath);

          sessions.push({
            id: sessionId,
            tool: toolName,
            path: fullPath,
            lastActive: stats.mtime.toISOString(),
            resumeCommand: `dev ai resume ${toolName} ${sessionId}`
          });
        }
      } catch (err) {
        // Skip unreadable entries
      }
    }
  } catch (err) {
    // Directory not readable, return empty
  }

  return sessions;
}

/**
 * Lists recent sessions for a specified AI tool by reading
 * the tool's session storage directory.
 *
 * @param {object} args - Parsed CLI arguments { positional, flags }.
 * @param {object} context - CLI context { output, errors }.
 */
async function run(args, context) {
  const toolName = args.positional[0];

  if (!toolName) {
    context.errors.throwError(400, 'Missing required argument: <tool>. Example: dev ai sessions claude', 'ai');
    return;
  }

  // Validate the tool name
  const toolConfig = AI_TOOLS[toolName];
  if (!toolConfig) {
    const available = Object.keys(AI_TOOLS).join(', ');
    context.output.info(`Unknown AI tool "${toolName}". Available: ${available}`);
    return;
  }

  // Find a session directory that exists
  let sessionDir = null;
  for (const candidate of toolConfig.sessionPaths) {
    if (fs.existsSync(candidate)) {
      sessionDir = candidate;
      break;
    }
  }

  if (!sessionDir) {
    context.output.info(
      `No session data found for ${toolConfig.displayName}. Sessions may be stored in a location DevUtils doesn't know about yet.`
    );
    return;
  }

  // Scan for sessions
  const sessions = findSessions(sessionDir, toolName);

  if (sessions.length === 0) {
    context.output.info(`No sessions found for ${toolConfig.displayName}.`);
    return;
  }

  // Sort by last-modified date, most recent first
  sessions.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));

  // Apply the limit
  const limit = args.flags.limit || 10;
  const limited = sessions.slice(0, limit);

  context.output.out(limited);
}

module.exports = { meta, run };
