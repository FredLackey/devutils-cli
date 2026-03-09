'use strict';

const meta = {
  description: 'Set DNS host records for a Namecheap domain',
  arguments: [
    { name: 'domain', required: true, description: 'The domain name to set DNS records for' }
  ],
  flags: [
    { name: '--type', alias: '-t', description: 'Record type (A, AAAA, CNAME, MX, TXT, etc.)' },
    { name: '--host', alias: '-h', description: 'Hostname or subdomain (e.g. www, @, mail)' },
    { name: '--value', alias: '-v', description: 'Record value (e.g. IP address, target hostname)' },
    { name: '--ttl', description: 'TTL in seconds' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires namecheap credentials.', 'namecheap');
}

module.exports = { meta, run };
