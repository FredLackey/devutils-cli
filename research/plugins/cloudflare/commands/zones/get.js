'use strict';

const meta = {
  description: 'Get details for a specific Cloudflare zone',
  arguments: [
    { name: 'zoneId', required: true, description: 'The ID or domain name of the zone' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires cloudflare credentials.', 'cloudflare');
}

module.exports = { meta, run };
