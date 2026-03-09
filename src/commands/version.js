'use strict';

/**
 * version command.
 * Reads the version string from package.json and prints it.
 * When format is json, outputs { version: "x.y.z" }.
 * When table/tty, outputs just the version string.
 */

const meta = {
  description: 'Show the current installed version',
  arguments: [],
  flags: []
};

/**
 * Prints the current DevUtils CLI version.
 *
 * @param {object} args - Parsed command arguments (none expected).
 * @param {object} context - The CLI context object with output, flags, etc.
 */
async function run(args, context) {
  const pkg = require('../../package.json');
  const version = pkg.version;

  if (context.flags.format === 'json') {
    context.output.out({ version });
  } else {
    context.output.info(version);
  }
}

module.exports = { meta, run };
