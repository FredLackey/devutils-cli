/**
 * Google Docs plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api docs ..."
  name: 'docs',

  // Human-readable description shown in "dev api list"
  description: 'Google Docs (documents)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login google")
  auth: 'google',

  // Resources and their commands
  resources: {
    documents: {
      description: 'Google Docs word-processing documents',
      commands: {
        list:   () => require('./commands/documents/list'),
        get:    () => require('./commands/documents/get'),
        create: () => require('./commands/documents/create')
      }
    }
  }
};
