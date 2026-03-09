'use strict';

const meta = {
  description: 'Get details for a specific Dokploy project',
  arguments: [
    { name: 'projectId', required: true, description: 'The ID of the project to retrieve' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires dokploy credentials.', 'dokploy');
}

module.exports = { meta, run };
