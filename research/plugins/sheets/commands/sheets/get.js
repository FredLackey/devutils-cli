'use strict';

const meta = {
  description: 'Get cell values from a sheet range',
  arguments: [
    { name: 'spreadsheetId', required: true, description: 'The ID of the spreadsheet' }
  ],
  flags: [
    { name: '--range', alias: '-r', description: 'A1 notation range to read (e.g. Sheet1!A1:D10)' },
    { name: '--sheet', alias: '-s', description: 'Sheet name (defaults to first sheet)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'sheets');
}

module.exports = { meta, run };
