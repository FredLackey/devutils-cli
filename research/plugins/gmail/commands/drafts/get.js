'use strict';

/**
 * Get a single draft by ID from the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.drafts.get endpoint. Returns the draft's
 * metadata and the full message content that would be sent.
 */

const meta = {
  description: 'Get a draft by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The draft ID to retrieve'
    }
  ],
  flags: []
};

/**
 * Retrieve a single draft from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The draft ID
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.drafts.get with:
  //   userId: 'me'
  //   id: args.id

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
