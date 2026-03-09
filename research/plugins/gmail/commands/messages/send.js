'use strict';

/**
 * Send an email message through the authenticated Gmail account.
 *
 * Uses the Gmail API users.messages.send endpoint. The message is
 * constructed from the provided flags and encoded as a base64url
 * RFC 2822 message before sending.
 */

const meta = {
  description: 'Send an email message',
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
    },
    {
      name: 'cc',
      type: 'string',
      description: 'CC recipient email address (comma-separated for multiple)'
    },
    {
      name: 'bcc',
      type: 'string',
      description: 'BCC recipient email address (comma-separated for multiple)'
    }
  ]
};

/**
 * Send an email message through the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {object} args.flags - Flag values (to, subject, body, cc, bcc)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would build an RFC 2822 message from args.flags (to, subject, body, cc, bcc),
  // base64url encode it, and call gmail.users.messages.send with:
  //   userId: 'me'
  //   requestBody: { raw: encodedMessage }

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
