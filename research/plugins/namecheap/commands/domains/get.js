'use strict';

const meta = {
  description: 'Get registration details for a Namecheap domain',
  arguments: [
    { name: 'domain', required: true, description: 'The domain name to look up (e.g. example.com)' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires namecheap credentials.', 'namecheap');
}

module.exports = { meta, run };
