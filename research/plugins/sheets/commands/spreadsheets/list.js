'use strict';

const meta = {
  description: 'List Google Sheets spreadsheets in Drive',
  arguments: [],
  flags: [
    { name: '--query', alias: '-q', description: 'Search query to filter spreadsheets' },
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'sheets');
}

module.exports = { meta, run };
