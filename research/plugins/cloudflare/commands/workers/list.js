'use strict';

const meta = {
  description: 'List Cloudflare Workers scripts in the account',
  arguments: [],
  flags: [
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires cloudflare credentials.', 'cloudflare');
}

module.exports = { meta, run };
