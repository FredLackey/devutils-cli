'use strict';

const meta = {
  description: 'Get configuration details for a Lambda function',
  arguments: [
    { name: 'functionName', required: true, description: 'Name or ARN of the Lambda function' }
  ],
  flags: [
    { name: '--region', alias: '-r', description: 'AWS region (overrides default)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
