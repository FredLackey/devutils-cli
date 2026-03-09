'use strict';

const meta = {
  description: 'List Cloudflare zones (domains) in the account',
  arguments: [],
  flags: [
    { name: '--status', alias: '-s', description: 'Filter by zone status (active, pending, etc.)' },
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires cloudflare credentials.', 'cloudflare');
}

module.exports = { meta, run };
