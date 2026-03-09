'use strict';

const meta = {
  description: 'Restart a service within a Dokploy project',
  arguments: [
    { name: 'serviceId', required: true, description: 'The ID of the service to restart' }
  ],
  flags: [
    { name: '--wait', alias: '-w', description: 'Wait for the service to be healthy before returning' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires dokploy credentials.', 'dokploy');
}

module.exports = { meta, run };
