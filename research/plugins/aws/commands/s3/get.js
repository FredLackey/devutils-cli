'use strict';

const meta = {
  description: 'Download an object from an S3 bucket',
  arguments: [
    { name: 'bucket', required: true, description: 'Name of the S3 bucket' },
    { name: 'key', required: true, description: 'Object key (path) within the bucket' }
  ],
  flags: [
    { name: '--output', alias: '-o', description: 'Local file path to save the object to' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
