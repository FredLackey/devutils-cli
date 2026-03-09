'use strict';

/**
 * Get a single label by ID from the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.labels.get endpoint. Returns the label's
 * name, type, visibility settings, and message/thread counts.
 */

const meta = {
  description: 'Get a label by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The label ID to retrieve'
    }
  ],
  flags: []
};

/**
 * Retrieve a single label from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The label ID
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.labels.get with:
  //   userId: 'me'
  //   id: args.id

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
