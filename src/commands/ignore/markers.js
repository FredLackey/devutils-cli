'use strict';

/**
 * Shared marker constants for DevUtils-managed .gitignore sections.
 *
 * These markers wrap each technology's patterns so that the ignore commands
 * can identify, replace, and remove sections without disturbing manually
 * added patterns. The format is:
 *
 *   # >>> devutils:<name>
 *   ... patterns ...
 *   # <<< devutils:<name>
 *
 * @module commands/ignore/markers
 */

/**
 * Returns the start marker for a given technology name.
 * @param {string} name - Technology name (e.g., 'node', 'macos').
 * @returns {string} The start marker line.
 */
const MARKER_START = (name) => `# >>> devutils:${name}`;

/**
 * Returns the end marker for a given technology name.
 * @param {string} name - Technology name (e.g., 'node', 'macos').
 * @returns {string} The end marker line.
 */
const MARKER_END = (name) => `# <<< devutils:${name}`;

/**
 * The prefix used to identify start markers when parsing .gitignore files.
 * @type {string}
 */
const MARKER_START_PREFIX = '# >>> devutils:';

/**
 * The prefix used to identify end markers when parsing .gitignore files.
 * @type {string}
 */
const MARKER_END_PREFIX = '# <<< devutils:';

module.exports = { MARKER_START, MARKER_END, MARKER_START_PREFIX, MARKER_END_PREFIX };
