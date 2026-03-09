'use strict';

/**
 * Delete a message by ID from the authenticated Gmail mailbox.
 *
 * Uses the Gmail API users.messages.delete endpoint. This permanently
 * deletes the message (it does not move it to Trash). The --confirm
 * flag is required to prevent accidental deletion.
 */

const meta = {
  description: 'Delete a message by ID',
  arguments: [
    {
      name: 'id',
      type: 'string',
      required: true,
      description: 'The message ID to delete'
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
 * Delete a message from the Gmail API.
 *
 * @param {object} args - Parsed command arguments and flags
 * @param {string} args.id - The message ID
 * @param {object} args.flags - Flag values (confirm)
 * @param {object} context - Provided by the core CLI
 * @param {object} context.auth - Authenticated Google client
 * @param {object} context.output - Output formatting helpers
 * @param {object} context.errors - Structured error creation (throwError)
 */
async function run(args, context) {
  // Would call gmail.users.messages.delete with:
  //   userId: 'me'
  //   id: args.id
  // Only after confirming with the user (unless --confirm is passed)

  context.errors.throwError(501, 'Requires Google API credentials. Run "dev auth login google" first.', 'gmail');
}

module.exports = { meta, run };
