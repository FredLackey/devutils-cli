'use strict';

const shell = require('../../lib/shell');

/**
 * Checks if QMD is installed and available on the system PATH.
 * Every search command calls this before doing anything else.
 *
 * @returns {object} { available: true } if found, or { available: false, message: '...' } if not.
 */
function checkQmd() {
  const isInstalled = shell.commandExists('qmd');

  if (!isInstalled) {
    return {
      available: false,
      message: 'QMD is not installed. Install it with: bun install -g @tobilu/qmd'
    };
  }

  return { available: true };
}

/**
 * Parses search results from QMD output.
 * Tries JSON first, then falls back to line-delimited text.
 * Returns an empty array for empty or null output.
 *
 * Output format may vary by QMD version.
 *
 * @param {string} output - The raw stdout from a QMD search command.
 * @returns {Array<object>} Parsed search results.
 */
function parseSearchResults(output) {
  if (!output || !output.trim()) {
    return [];
  }

  // Try JSON first
  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (err) {
    // Fall back to line-delimited text
  }

  // Parse as line-delimited results
  return output.trim().split('\n').filter(Boolean).map(line => ({ raw: line }));
}

/**
 * Runs a QMD search command and parses the results.
 * Returns null if the command fails (error is reported via context.errors).
 *
 * @param {string} cmd - The full QMD command to run.
 * @param {object} context - The CLI context (needs context.errors).
 * @returns {Promise<Array<object>|null>} Parsed results, or null on failure.
 */
async function runQmdSearch(cmd, context) {
  const result = await shell.exec(cmd);

  if (result.exitCode !== 0) {
    context.errors.throwError(1, result.stderr || `QMD command failed: ${cmd}`, 'search');
    return null;
  }

  return parseSearchResults(result.stdout);
}

module.exports = { checkQmd, parseSearchResults, runQmdSearch };
