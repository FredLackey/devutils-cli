'use strict';

const meta = {
  description: 'List Lambda functions in the configured AWS region',
  arguments: [],
  flags: [
    { name: '--region', alias: '-r', description: 'AWS region to query (overrides default)' },
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
