'use strict';

const meta = {
  description: 'Check domain name availability on Namecheap',
  arguments: [
    { name: 'domain', required: true, description: 'The domain name to check (e.g. example.com)' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires namecheap credentials.', 'namecheap');
}

module.exports = { meta, run };
