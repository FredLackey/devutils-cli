'use strict';

/**
 * Create a new draft in the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.drafts.create endpoint. The draft message
 * is constructed from the provided flags and stored without sending.
 * Use "dev api gmail drafts send" to send a saved draft.
 */

const meta = {
  description: 'Create a new draft message',
  arguments: [],
  flags: [
    {
      name: 'to',
      type: 'string',
      required: true,
      description: 'Recipient email address'
    },
    {
      name: 'subject',
      type: 'string',
      required: true,
      description: 'Email subject line'
    },
    {
      name: 'body',
      type: 'string',
      required: true,
      description: 'Email body text'
    }
  ]
};

/**
 * Create a new draft via the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {object} args.flags - Flag values (to, subject, body)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would build an RFC 2822 message from args.flags (to, subject, body),
  // base64url encode it, and call gmail.users.drafts.create with:
  //   userId: 'me'
  //   requestBody: { message: { raw: encodedMessage } }

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
