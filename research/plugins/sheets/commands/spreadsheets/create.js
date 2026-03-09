'use strict';

const meta = {
  description: 'Create a new Google Sheets spreadsheet',
  arguments: [],
  flags: [
    { name: '--title', alias: '-t', description: 'Title of the new spreadsheet' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'sheets');
}

module.exports = { meta, run };
