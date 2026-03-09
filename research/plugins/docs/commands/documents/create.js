'use strict';

const meta = {
  description: 'Create a new Google Docs document',
  arguments: [],
  flags: [
    { name: '--title', alias: '-t', description: 'Title of the new document' },
    { name: '--folder', alias: '-f', description: 'Drive folder ID to create the document in' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'docs');
}

module.exports = { meta, run };
