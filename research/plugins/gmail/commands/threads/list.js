'use strict';

/**
 * List conversation threads in the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.threads.list endpoint. Each thread groups
 * related messages into a single conversation. Results can be filtered
 * by label or capped with a limit flag.
 */

const meta = {
  description: 'List conversation threads',
  arguments: [],
  flags: [
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of threads to return (default 25)'
    },
    {
      name: 'label',
      type: 'string',
      description: 'Filter threads by label name (e.g. INBOX, SENT, STARRED)'
    }
  ]
};

/**
 * Retrieve a list of threads from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {object} args.flags - Flag values (limit, label)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.threads.list with:
  //   userId: 'me'
  //   maxResults: args.flags.limit || 25
  //   labelIds: args.flags.label ? [args.flags.label] : undefined

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
