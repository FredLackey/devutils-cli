'use strict';

const meta = {
  description: 'List phone numbers provisioned on the Flowroute account',
  arguments: [],
  flags: [
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' },
    { name: '--contains', alias: '-c', description: 'Filter numbers containing this digit pattern' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires flowroute credentials.', 'flowroute');
}

module.exports = { meta, run };
