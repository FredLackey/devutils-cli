#!/usr/bin/env node

/**
 * @fileoverview Extract dependency names from package.json.
 * @module scripts/get-dependencies
 */

/**
 * Extracts and lists dependency names from a package.json file.
 * Can filter by dependency type (dependencies, devDependencies, etc.).
 *
 * @param {string[]} args - Command line arguments
 * @param {string} args.0 - Path to package.json
 * @param {string} [args.1] - Dependency type: "dev", "peer", "opt", or "dependencies"
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement dependency extraction
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
