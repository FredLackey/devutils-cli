'use strict';

const meta = {
  description: 'Upload a file to an S3 bucket',
  arguments: [
    { name: 'filePath', required: true, description: 'Local file path to upload' },
    { name: 'bucket', required: true, description: 'Name of the S3 bucket' }
  ],
  flags: [
    { name: '--key', alias: '-k', description: 'Object key in the bucket (defaults to filename)' },
    { name: '--content-type', description: 'MIME type of the object (auto-detected if omitted)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
