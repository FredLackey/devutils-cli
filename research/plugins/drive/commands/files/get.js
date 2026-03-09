'use strict';

const meta = {
  description: 'Get metadata or download a file from Google Drive',
  arguments: [
    { name: 'fileId', required: true, description: 'The ID of the file to retrieve' }
  ],
  flags: [
    { name: '--download', alias: '-d', description: 'Download the file content instead of just metadata' },
    { name: '--output', alias: '-o', description: 'Output path for downloaded file' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'drive');
}

module.exports = { meta, run };
