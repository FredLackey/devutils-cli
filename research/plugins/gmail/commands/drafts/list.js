'use strict';

/**
 * List drafts in the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.drafts.list endpoint. Returns draft
 * summaries including the draft ID and a snippet of the message
 * content.
 */

const meta = {
  description: 'List drafts in the mailbox',
  arguments: [],
  flags: [
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of drafts to return (default 25)'
    }
  ]
};

/**
 * Retrieve a list of drafts from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {object} args.flags - Flag values (limit)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.drafts.list with:
  //   userId: 'me'
  //   maxResults: args.flags.limit || 25

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
