'use strict';

const meta = {
  description: 'List sharing permissions on a Google Drive file',
  arguments: [
    { name: 'fileId', required: true, description: 'The ID of the file to list permissions for' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'drive');
}

module.exports = { meta, run };
