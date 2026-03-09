'use strict';

const meta = {
  description: 'Upload a file to Google Drive',
  arguments: [
    { name: 'filePath', required: true, description: 'Local path of the file to upload' }
  ],
  flags: [
    { name: '--name', alias: '-n', description: 'Name for the file in Drive (defaults to local filename)' },
    { name: '--folder', alias: '-f', description: 'Parent folder ID to upload into' },
    { name: '--mime', alias: '-m', description: 'MIME type of the file (auto-detected if omitted)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'drive');
}

module.exports = { meta, run };
