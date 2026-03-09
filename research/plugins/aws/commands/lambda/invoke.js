'use strict';

const meta = {
  description: 'Invoke a Lambda function and return the response',
  arguments: [
    { name: 'functionName', required: true, description: 'Name or ARN of the Lambda function to invoke' }
  ],
  flags: [
    { name: '--payload', alias: '-p', description: 'JSON payload to pass to the function' },
    { name: '--region', alias: '-r', description: 'AWS region (overrides default)' },
    { name: '--async', description: 'Invoke asynchronously (do not wait for response)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires aws credentials.', 'aws');
}

module.exports = { meta, run };
