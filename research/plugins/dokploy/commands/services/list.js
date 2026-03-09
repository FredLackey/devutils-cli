'use strict';

const meta = {
  description: 'List services within a Dokploy project',
  arguments: [
    { name: 'projectId', required: true, description: 'The ID of the project to list services for' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires dokploy credentials.', 'dokploy');
}

module.exports = { meta, run };
