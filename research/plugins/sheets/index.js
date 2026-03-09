/**
 * Google Sheets plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api sheets ..."
  name: 'sheets',

  // Human-readable description shown in "dev api list"
  description: 'Google Sheets (spreadsheets, sheets)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login google")
  auth: 'google',

  // Resources and their commands
  resources: {
    spreadsheets: {
      description: 'Google Sheets spreadsheet documents',
      commands: {
        list:   () => require('./commands/spreadsheets/list'),
        get:    () => require('./commands/spreadsheets/get'),
        create: () => require('./commands/spreadsheets/create')
      }
    },
    sheets: {
      description: 'Individual sheets (tabs) within a spreadsheet',
      commands: {
        list:   () => require('./commands/sheets/list'),
        get:    () => require('./commands/sheets/get'),
        append: () => require('./commands/sheets/append')
      }
    }
  }
};
