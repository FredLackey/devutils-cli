/**
 * Mailu plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api mailu ..."
  name: 'mailu',

  // Human-readable description shown in "dev api list"
  description: 'Mailu (mail domains, users)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login mailu")
  auth: 'mailu',

  // Resources and their commands
  resources: {
    domains: {
      description: 'Mail domains hosted on the Mailu server',
      commands: {
        list:   () => require('./commands/domains/list'),
        create: () => require('./commands/domains/create'),
        delete: () => require('./commands/domains/delete')
      }
    },
    users: {
      description: 'Mailbox user accounts within a domain',
      commands: {
        list:   () => require('./commands/users/list'),
        create: () => require('./commands/users/create'),
        delete: () => require('./commands/users/delete')
      }
    }
  }
};
