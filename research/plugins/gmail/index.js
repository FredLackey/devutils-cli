/**
 * Gmail plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api gmail ..."
  name: 'gmail',

  // Human-readable description shown in "dev api list"
  description: 'Gmail (messages, labels, drafts, threads)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login google")
  auth: 'google',

  // Resources and their commands
  resources: {
    messages: {
      description: 'Email messages in the authenticated mailbox',
      commands: {
        list:   () => require('./commands/messages/list'),
        get:    () => require('./commands/messages/get'),
        send:   () => require('./commands/messages/send'),
        delete: () => require('./commands/messages/delete')
      }
    },
    labels: {
      description: 'Gmail labels used to organize messages',
      commands: {
        list:   () => require('./commands/labels/list'),
        get:    () => require('./commands/labels/get'),
        create: () => require('./commands/labels/create'),
        delete: () => require('./commands/labels/delete')
      }
    },
    drafts: {
      description: 'Draft messages saved but not yet sent',
      commands: {
        list:   () => require('./commands/drafts/list'),
        get:    () => require('./commands/drafts/get'),
        create: () => require('./commands/drafts/create'),
        send:   () => require('./commands/drafts/send'),
        delete: () => require('./commands/drafts/delete')
      }
    },
    threads: {
      description: 'Conversation threads grouping related messages',
      commands: {
        list: () => require('./commands/threads/list'),
        get:  () => require('./commands/threads/get')
      }
    }
  }
};
