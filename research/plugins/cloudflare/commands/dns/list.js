'use strict';

const meta = {
  description: 'List DNS records for a Cloudflare zone',
  arguments: [
    { name: 'zoneId', required: true, description: 'The ID or domain name of the zone' }
  ],
  flags: [
    { name: '--type', alias: '-t', description: 'Filter by record type (A, AAAA, CNAME, MX, TXT, etc.)' },
    { name: '--name', alias: '-n', description: 'Filter by record name' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires cloudflare credentials.', 'cloudflare');
}

module.exports = { meta, run };
