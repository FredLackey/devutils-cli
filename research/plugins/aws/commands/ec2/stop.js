'use strict';

const meta = {
  description: 'Stop one or more running EC2 instances',
  arguments: [
    { name: 'instanceIds', required: true, description: 'Comma-separated list of instance IDs to stop' }
  ],
  flags: [
    { name: '--region', alias: '-r', description: 'AWS region (overrides default)' },
    { name: '--force', description: 'Force stop without waiting for graceful shutdown' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
