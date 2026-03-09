'use strict';

/**
 * Send a draft by ID from the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.drafts.send endpoint. The draft must
 * already exist -- use "dev api gmail drafts create" to create one
 * first. Sending a draft removes it from the drafts list and places
 * the sent message in the SENT label.
 */

const meta = {
  description: 'Send a draft by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The draft ID to send'
    }
  ],
  flags: []
};

/**
 * Send a draft via the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The draft ID
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.drafts.send with:
  //   userId: 'me'
  //   requestBody: { id: args.id }

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
