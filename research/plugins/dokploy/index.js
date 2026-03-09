/**
 * Dokploy plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api dokploy ..."
  name: 'dokploy',

  // Human-readable description shown in "dev api list"
  description: 'Dokploy (projects, services)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login dokploy")
  auth: 'dokploy',

  // Resources and their commands
  resources: {
    projects: {
      description: 'Dokploy projects grouping related services',
      commands: {
        list:   () => require('./commands/projects/list'),
        get:    () => require('./commands/projects/get'),
        deploy: () => require('./commands/projects/deploy')
      }
    },
    services: {
      description: 'Individual services running within a project',
      commands: {
        list:    () => require('./commands/services/list'),
        restart: () => require('./commands/services/restart')
      }
    }
  }
};
