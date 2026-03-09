'use strict';

const meta = {
  description: 'List all projects on the Dokploy server',
  arguments: [],
  flags: [
    { name: '--limit', alias: '-n', description: 'Maximum number of results to return' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires dokploy credentials.', 'dokploy');
}

module.exports = { meta, run };
