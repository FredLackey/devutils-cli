'use strict';

const meta = {
  description: 'Send an SMS or MMS message via Flowroute',
  arguments: [
    { name: 'to', required: true, description: 'Recipient phone number (E.164 format)' }
  ],
  flags: [
    { name: '--from', alias: '-f', description: 'Sender phone number (must be a provisioned Flowroute number)' },
    { name: '--body', alias: '-b', description: 'Message body text' },
    { name: '--media', alias: '-m', description: 'URL of media attachment for MMS' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires flowroute credentials.', 'flowroute');
}

module.exports = { meta, run };
