'use strict';

/**
 * Get a single message by ID from the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.messages.get endpoint. By default returns a
 * minimal representation (id, snippet, labelIds). Pass --full to get
 * the complete message including headers, body, and attachments.
 */

const meta = {
  description: 'Get a single message by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The message ID to retrieve'
    }
  ],
  flags: [
    {
      name: 'full',
      type: 'boolean',
      description: 'Return the full message payload including headers and body'
    }
  ]
};

/**
 * Retrieve a single message from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The message ID
 * @param {object} args.flags - Flag values (full)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.messages.get with:
  //   userId: 'me'
  //   id: args.id
  //   format: args.flags.full ? 'full' : 'metadata'

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
