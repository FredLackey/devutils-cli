'use strict';

const meta = {
  description: 'List SMS and MMS messages sent or received via Flowroute',
  arguments: [],
  flags: [
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' },
    { name: '--start-date', description: 'Filter messages after this date (ISO 8601)' },
    { name: '--end-date', description: 'Filter messages before this date (ISO 8601)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires flowroute credentials.', 'flowroute');
}

module.exports = { meta, run };
