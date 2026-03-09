'use strict';

const meta = {
  description: 'Delete a file or folder from Google Drive',
  arguments: [
    { name: 'fileId', required: true, description: 'The ID of the file to delete' }
  ],
  flags: [
    { name: '--force', description: 'Skip confirmation prompt' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'drive');
}

module.exports = { meta, run };
