'use strict';

const meta = {
  description: 'Add a new mail domain to the Mailu server',
  arguments: [
    { name: 'domain', required: true, description: 'The domain name to add (e.g. example.com)' }
  ],
  flags: [
    { name: '--max-users', description: 'Maximum number of mailboxes allowed on this domain' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires mailu credentials.', 'mailu');
}

module.exports = { meta, run };
