#!/usr/bin/env node

/**
 * @fileoverview Open all subdirectories in VS Code.
 * @module scripts/code-all
 */

/**
 * Opens each immediate subdirectory of the current directory
 * as a separate VS Code window.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional path (defaults to current directory)
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement VS Code multi-open
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
