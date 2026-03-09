'use strict';

const meta = {
  description: 'List mail domains hosted on the Mailu server',
  arguments: [],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires mailu credentials.', 'mailu');
}

module.exports = { meta, run };
