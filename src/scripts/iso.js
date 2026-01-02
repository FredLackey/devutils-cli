#!/usr/bin/env node

/**
 * @fileoverview Print ISO 8601 timestamp.
 * @module scripts/iso
 */

/**
 * Outputs the current date and time in ISO 8601 format.
 * Optionally uses a specific timezone.
 *
 * @param {string[]} args - Command line arguments
 * @param {string} [args.0] - Optional timezone (e.g., "America/Los_Angeles")
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement ISO timestamp output
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
