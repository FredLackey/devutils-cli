/**
 * Google Drive plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api drive ..."
  name: 'drive',

  // Human-readable description shown in "dev api list"
  description: 'Google Drive (files, permissions)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login google")
  auth: 'google',

  // Resources and their commands
  resources: {
    files: {
      description: 'Files and folders stored in Google Drive',
      commands: {
        list:   () => require('./commands/files/list'),
        get:    () => require('./commands/files/get'),
        upload: () => require('./commands/files/upload'),
        delete: () => require('./commands/files/delete')
      }
    },
    permissions: {
      description: 'Sharing permissions on Drive files and folders',
      commands: {
        list: () => require('./commands/permissions/list'),
        set:  () => require('./commands/permissions/set')
      }
    }
  }
};
