'use strict';

const meta = {
  description: 'Start one or more stopped EC2 instances',
  arguments: [
    { name: 'instanceIds', required: true, description: 'Comma-separated list of instance IDs to start' }
  ],
  flags: [
    { name: '--region', alias: '-r', description: 'AWS region (overrides default)' },
    { name: '--wait', alias: '-w', description: 'Wait until instances are in running state' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
