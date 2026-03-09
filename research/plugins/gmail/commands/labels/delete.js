'use strict';

/**
 * Delete a label by ID from the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.labels.delete endpoint. System labels
 * (INBOX, SENT, etc.) cannot be deleted. The --confirm flag is
 * required to prevent accidental deletion.
 */

const meta = {
  description: 'Delete a label by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The label ID to delete'
    }
  ],
  flags: [
    {
      name: 'confirm',
      type: 'boolean',
      description: 'Skip the confirmation prompt and delete immediately'
    }
  ]
};

/**
 * Delete a label from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The label ID
 * @param {object} args.flags - Flag values (confirm)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.labels.delete with:
  //   userId: 'me'
  //   id: args.id
  // Only after confirming with the user (unless --confirm is passed)

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
