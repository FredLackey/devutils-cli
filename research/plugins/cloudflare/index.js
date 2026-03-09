/**
 * Cloudflare plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api cloudflare ..."
  name: 'cloudflare',

  // Human-readable description shown in "dev api list"
  description: 'Cloudflare (zones, DNS, Workers)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login cloudflare")
  auth: 'cloudflare',

  // Resources and their commands
  resources: {
    zones: {
      description: 'Cloudflare zones (domains) managed by the account',
      commands: {
        list: () => require('./commands/zones/list'),
        get:  () => require('./commands/zones/get')
      }
    },
    dns: {
      description: 'DNS records within a Cloudflare zone',
      commands: {
        list:   () => require('./commands/dns/list'),
        create: () => require('./commands/dns/create'),
        delete: () => require('./commands/dns/delete')
      }
    },
    workers: {
      description: 'Cloudflare Workers serverless scripts',
      commands: {
        list:   () => require('./commands/workers/list'),
        get:    () => require('./commands/workers/get'),
        deploy: () => require('./commands/workers/deploy')
      }
    }
  }
};
