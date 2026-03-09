'use strict';

const meta = {
  description: 'Delete a DNS record from a Cloudflare zone',
  arguments: [
    { name: 'zoneId', required: true, description: 'The ID or domain name of the zone' },
    { name: 'recordId', required: true, description: 'The ID of the DNS record to delete' }
  ],
  flags: [
    { name: '--force', description: 'Skip confirmation prompt' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires cloudflare credentials.', 'cloudflare');
}

module.exports = { meta, run };
