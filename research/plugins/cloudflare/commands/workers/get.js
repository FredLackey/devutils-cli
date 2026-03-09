'use strict';

const meta = {
  description: 'Get details and metadata for a Cloudflare Worker script',
  arguments: [
    { name: 'scriptName', required: true, description: 'Name of the Worker script' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires cloudflare credentials.', 'cloudflare');
}

module.exports = { meta, run };
