/**
 * Flowroute plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api flowroute ..."
  name: 'flowroute',

  // Human-readable description shown in "dev api list"
  description: 'Flowroute (phone numbers, SMS messages)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login flowroute")
  auth: 'flowroute',

  // Resources and their commands
  resources: {
    numbers: {
      description: 'Phone numbers provisioned through Flowroute',
      commands: {
        list:     () => require('./commands/numbers/list'),
        purchase: () => require('./commands/numbers/purchase'),
        release:  () => require('./commands/numbers/release')
      }
    },
    messages: {
      description: 'SMS and MMS messages sent via Flowroute',
      commands: {
        send: () => require('./commands/messages/send'),
        list: () => require('./commands/messages/list')
      }
    }
  }
};
