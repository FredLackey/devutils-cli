#!/usr/bin/env node

/**
 * @fileoverview Search for packages via Homebrew.
 * @module scripts/brews
 */

/**
 * Searches for packages matching the specified term using Homebrew.
 * Shorthand for `brew search`.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Search term
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement brew search
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
