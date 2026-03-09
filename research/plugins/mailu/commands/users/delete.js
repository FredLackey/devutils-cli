'use strict';

const meta = {
  description: 'Delete a mailbox user from a Mailu domain',
  arguments: [
    { name: 'email', required: true, description: 'Email address of the user to delete' }
  ],
  flags: [
    { name: '--force', description: 'Skip confirmation prompt' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires mailu credentials.', 'mailu');
}

module.exports = { meta, run };
