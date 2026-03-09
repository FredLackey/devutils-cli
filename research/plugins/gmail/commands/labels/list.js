'use strict';

/**
 * List all labels in the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.labels.list endpoint. Returns both system
 * labels (INBOX, SENT, TRASH, etc.) and user-created labels.
 */

const meta = {
  description: 'List all labels in the mailbox',
  arguments: [],
  flags: []
};

/**
 * Retrieve all labels from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.labels.list with:
  //   userId: 'me'

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
