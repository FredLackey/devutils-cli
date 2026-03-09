'use strict';

const meta = {
  description: 'Get metadata for a Google Sheets spreadsheet',
  arguments: [
    { name: 'spreadsheetId', required: true, description: 'The ID of the spreadsheet to retrieve' }
  ],
  flags: []
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'sheets');
}

module.exports = { meta, run };
