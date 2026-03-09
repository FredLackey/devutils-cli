'use strict';

const meta = {
  description: 'List Google Docs documents in Drive',
  arguments: [],
  flags: [
    { name: '--query', alias: '-q', description: 'Search query to filter documents' },
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'docs');
}

module.exports = { meta, run };
