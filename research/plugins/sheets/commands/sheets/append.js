'use strict';

const meta = {
  description: 'Append rows to a sheet',
  arguments: [
    { name: 'spreadsheetId', required: true, description: 'The ID of the spreadsheet' }
  ],
  flags: [
    { name: '--range', alias: '-r', description: 'A1 notation range to append after (e.g. Sheet1!A1)' },
    { name: '--values', alias: '-v', description: 'JSON array of row values to append' },
    { name: '--sheet', alias: '-s', description: 'Sheet name (defaults to first sheet)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'sheets');
}

module.exports = { meta, run };
