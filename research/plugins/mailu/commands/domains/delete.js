'use strict';

const meta = {
  description: 'Remove a mail domain from the Mailu server',
  arguments: [
    { name: 'domain', required: true, description: 'The domain name to remove' }
  ],
  flags: [
    { name: '--force', description: 'Skip confirmation prompt' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires mailu credentials.', 'mailu');
}

module.exports = { meta, run };
