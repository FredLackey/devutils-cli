'use strict';

const meta = {
  description: 'List mailbox users on a Mailu domain',
  arguments: [
    { name: 'domain', required: true, description: 'The domain to list users for' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires mailu credentials.', 'mailu');
}

module.exports = { meta, run };
