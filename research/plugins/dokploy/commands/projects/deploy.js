'use strict';

const meta = {
  description: 'Trigger a deployment for a Dokploy project',
  arguments: [
    { name: 'projectId', required: true, description: 'The ID of the project to deploy' }
  ],
  flags: [
    { name: '--wait', alias: '-w', description: 'Wait for deployment to complete before returning' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires dokploy credentials.', 'dokploy');
}

module.exports = { meta, run };
