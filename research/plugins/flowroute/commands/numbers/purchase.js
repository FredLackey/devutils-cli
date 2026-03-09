'use strict';

const meta = {
  description: 'Purchase a phone number from Flowroute',
  arguments: [
    { name: 'number', required: true, description: 'The phone number to purchase (E.164 format)' }
  ],
  flags: [
    { name: '--force', description: 'Skip confirmation prompt' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires flowroute credentials.', 'flowroute');
}

module.exports = { meta, run };
