'use strict';

const meta = {
  description: 'List individual sheets (tabs) within a spreadsheet',
  arguments: [
    { name: 'spreadsheetId', required: true, description: 'The ID of the spreadsheet' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'sheets');
}

module.exports = { meta, run };
