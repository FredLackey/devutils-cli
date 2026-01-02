#!/usr/bin/env node

/**
 * @fileoverview Install packages via Homebrew.
 * @module scripts/brewi
 */

/**
 * Installs the specified package(s) using Homebrew.
 * Shorthand for `brew install`.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Package name to install
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement brew install
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
