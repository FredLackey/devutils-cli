'use strict';

const meta = {
  description: 'Release a phone number from the Flowroute account',
  arguments: [
    { name: 'number', required: true, description: 'The phone number to release (E.164 format)' }
  ],
  flags: [
    { name: '--force', description: 'Skip confirmation prompt' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires flowroute credentials.', 'flowroute');
}

module.exports = { meta, run };
