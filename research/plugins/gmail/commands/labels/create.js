'use strict';

/**
 * Create a new label in the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.labels.create endpoint. The label name is
 * provided as a positional argument. Nested labels use "/" as the
 * separator (e.g. "Projects/Active").
 */

const meta = {
  description: 'Create a new label',
  arguments: [
    {
      name: 'name',
      type: 'string',
      required: true,
      description: 'Name for the new label (use "/" for nesting, e.g. "Projects/Active")'
    }
  ],
  flags: []
};

/**
 * Create a new label via the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.name - The label name to create
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.labels.create with:
  //   userId: 'me'
  //   requestBody: { name: args.name }

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
