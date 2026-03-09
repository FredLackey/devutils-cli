'use strict';

const meta = {
  description: 'List domains registered with Namecheap',
  arguments: [],
  flags: [
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' },
    { name: '--sort', alias: '-s', description: 'Sort field (name, expiry, created)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires namecheap credentials.', 'namecheap');
}

module.exports = { meta, run };
