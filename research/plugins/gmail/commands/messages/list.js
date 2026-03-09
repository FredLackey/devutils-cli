'use strict';

/**
 * List messages in the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.messages.list endpoint to retrieve message
 * summaries. Results can be filtered by label, free-text query, or
 * capped with a limit flag.
 */

const meta = {
  description: 'List messages in the authenticated mailbox',
  arguments: [],
  flags: [
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of messages to return (default 25)'
    },
    {
      name: 'label',
      type: 'string',
      description: 'Filter messages by label name (e.g. INBOX, SENT, STARRED)'
    },
    {
      name: 'query',
      type: 'string',
      description: 'Gmail search query string (same syntax as the Gmail search bar)'
    }
  ]
};

/**
 * Retrieve a list of messages from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {object} args.flags - Flag values (limit, label, query)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 * @param {object} context.config - Read-only user config access
 */
async function run(args, context) {
  // Would call gmail.users.messages.list with:
  //   userId: 'me'
  //   maxResults: args.flags.limit || 25
  //   labelIds: args.flags.label ? [args.flags.label] : undefined
  //   q: args.flags.query || undefined

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
