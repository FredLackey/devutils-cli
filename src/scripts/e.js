#!/usr/bin/env node

/**
 * @fileoverview Open a file in vim editor.
 * @module scripts/e
 */

/**
 * Opens the specified file(s) in the vim editor.
 * Passes all arguments directly to vim.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - File path to open in vim
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement vim launcher
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
