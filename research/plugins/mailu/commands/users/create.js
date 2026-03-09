'use strict';

const meta = {
  description: 'Create a new mailbox user on a Mailu domain',
  arguments: [
    { name: 'email', required: true, description: 'Email address for the new user (e.g. user@example.com)' }
  ],
  flags: [
    { name: '--password', alias: '-p', description: 'Password for the new mailbox (prompted if omitted)' },
    { name: '--display-name', alias: '-d', description: 'Display name for the user' },
    { name: '--quota', alias: '-q', description: 'Mailbox storage quota in bytes' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires mailu credentials.', 'mailu');
}

module.exports = { meta, run };
