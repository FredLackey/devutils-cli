/**
 * <Service display name> plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api <name> ..."
  name: '<service>',

  // Human-readable description shown in "dev api list"
  description: '<Service display name> (<resource1>, <resource2>, ...)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login <auth>")
  auth: '<auth-service>',

  // Resources and their commands
  resources: {
    sample: {
      description: 'Sample resource (replace with real resource)',
      commands: {
        list: () => require('./commands/sample/list'),
        // Add more commands here:
        // get:    () => require('./commands/sample/get'),
        // create: () => require('./commands/sample/create'),
      }
    }
    // Add more resources here:
    // another: {
    //   description: 'Another resource',
    //   commands: {
    //     list: () => require('./commands/another/list'),
    //   }
    // }
  }
};
