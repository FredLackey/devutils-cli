'use strict';

/**
 * Environment variables set by AI coding assistants.
 * Each entry is [varName, expectedValue].
 * expectedValue can be null to match any truthy value.
 */
const AI_ENV_VARS = [
  ['CLAUDECODE', '1'],
  ['GEMINI_CLI', '1'],
];

/**
 * Environment variables set by CI/CD systems.
 * Each entry is [varName, expectedValue].
 * expectedValue can be null to match any truthy value.
 */
const CI_ENV_VARS = [
  ['CI', 'true'],
  ['BUILD_NUMBER', null],
  ['TF_BUILD', 'True'],
];

/**
 * Checks if any environment variable in the list is set and matches.
 * When expectedValue is null, any truthy value counts as a match.
 *
 * @param {Array<[string, string|null]>} varList - Array of [varName, expectedValue] pairs.
 * @returns {boolean}
 */
function matchesEnv(varList) {
  for (const [varName, expectedValue] of varList) {
    const actual = process.env[varName];
    if (actual === undefined) continue;
    if (expectedValue === null) return true;
    if (actual === expectedValue) return true;
  }
  return false;
}

/**
 * Detects the output mode based on the calling environment.
 * Checks three layers in priority order: AI tools, CI/CD, then TTY.
 *
 * - AI tools (Claude Code, Gemini CLI) get JSON format.
 * - CI/CD systems (GitHub Actions, Jenkins, Azure) get JSON format.
 * - Humans at a terminal get table format.
 * - Piped or redirected output gets JSON format.
 *
 * @returns {{ format: string, caller: string }}
 *   - format: 'json' or 'table'
 *   - caller: 'ai', 'ci', 'tty', or 'pipe'
 */
function detectOutputMode() {
  // Layer 1: AI tool environment
  if (matchesEnv(AI_ENV_VARS)) {
    return { format: 'json', caller: 'ai' };
  }

  // Layer 2: CI/CD environment
  if (matchesEnv(CI_ENV_VARS)) {
    return { format: 'json', caller: 'ci' };
  }

  // Layer 3: TTY detection
  if (process.stdout.isTTY) {
    return { format: 'table', caller: 'tty' };
  }

  // Fallback: piped or redirected output
  return { format: 'json', caller: 'pipe' };
}

module.exports = { detectOutputMode };
