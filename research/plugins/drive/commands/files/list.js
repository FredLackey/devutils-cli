'use strict';

const meta = {
  description: 'List files and folders in Google Drive',
  arguments: [],
  flags: [
    { name: '--query', alias: '-q', description: 'Search query string (Drive API q parameter)' },
    { name: '--folder', alias: '-f', description: 'Parent folder ID to list contents of' },
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'drive');
}

module.exports = { meta, run };
