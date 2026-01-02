#!/usr/bin/env node

/**
 * @fileoverview Terraform plan with output file.
 * @module scripts/tpo
 */

/**
 * Executes `terraform plan` and saves the plan to a file named "tfplan"
 * for later application with `terraform apply`.
 *
 * @param {string[]} args - Command line arguments to pass to terraform plan
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement terraform plan with output
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
