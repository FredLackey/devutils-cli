/**
 * Namecheap plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api namecheap ..."
  name: 'namecheap',

  // Human-readable description shown in "dev api list"
  description: 'Namecheap (domains, DNS)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login namecheap")
  auth: 'namecheap',

  // Resources and their commands
  resources: {
    domains: {
      description: 'Domain registrations managed through Namecheap',
      commands: {
        list:  () => require('./commands/domains/list'),
        get:   () => require('./commands/domains/get'),
        check: () => require('./commands/domains/check')
      }
    },
    dns: {
      description: 'DNS host records for Namecheap domains',
      commands: {
        list: () => require('./commands/dns/list'),
        set:  () => require('./commands/dns/set')
      }
    }
  }
};
