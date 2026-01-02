#!/usr/bin/env node

/**
 * @fileoverview Terraform apply from plan file.
 * @module scripts/tpa
 */

/**
 * Executes `terraform apply` using the previously saved "tfplan" file
 * created by `tpo`.
 *
 * @param {string[]} args - Command line arguments to pass to terraform apply
 * @returns {Promise<void>}
 */
async function main(args) {
  // TODO: Implement terraform apply from plan
}

module.exports = { main };

if (require.main === module) {
  main(process.argv.slice(2));
}
