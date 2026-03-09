'use strict';

const meta = {
  description: 'Get the content and metadata of a Google Docs document',
  arguments: [
    { name: 'documentId', required: true, description: 'The ID of the document to retrieve' }
  ],
  flags: [
    { name: '--format', alias: '-f', description: 'Output format (json, text, markdown)' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'docs');
}

module.exports = { meta, run };
