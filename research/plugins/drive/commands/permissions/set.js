'use strict';

const meta = {
  description: 'Set sharing permissions on a Google Drive file',
  arguments: [
    { name: 'fileId', required: true, description: 'The ID of the file to set permissions on' }
  ],
  flags: [
    { name: '--role', alias: '-r', description: 'Permission role (reader, writer, commenter, owner)' },
    { name: '--type', alias: '-t', description: 'Grantee type (user, group, domain, anyone)' },
    { name: '--email', alias: '-e', description: 'Email address of the user or group' }
  ]
};

async function run(args, context) {
  context.errors.throwError(501, 'Not implemented. Requires google credentials.', 'drive');
}

module.exports = { meta, run };
