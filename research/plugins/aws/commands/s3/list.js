'use strict';

const meta = {
  description: 'List S3 buckets or objects within a bucket',
  arguments: [],
  flags: [
    { name: '--bucket', alias: '-b', description: 'Bucket name to list objects in (omit to list buckets)' },
    { name: '--prefix', alias: '-p', description: 'Key prefix to filter objects' },
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
