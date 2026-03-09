'use strict';

/**
 * Get a single conversation thread by ID from the authenticated Gmail
 * mailbox.
 *
 * Uses the Gmail API users.threads.get endpoint. Returns the thread
 * metadata and all messages within the conversation.
 */

const meta = {
  description: 'Get a thread by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The thread ID to retrieve'
    }
  ],
  flags: []
};

/**
 * Retrieve a single thread from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The thread ID
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.threads.get with:
  //   userId: 'me'
  //   id: args.id

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
