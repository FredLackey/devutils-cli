/**
 * Search service registration.
 * Markdown search via QMD (requires separate install).
 *
 * All commands in this service check for QMD availability first.
 * If QMD is not installed, they return an error with installation
 * instructions: bun install -g @tobilu/qmd
 */
module.exports = {
  name: 'search',
  description: 'Markdown search via QMD',
  commands: {
    query:       () => require('./query'),
    keyword:     () => require('./keyword'),
    semantic:    () => require('./semantic'),
    get:         () => require('./get'),
    collections: () => require('./collections'),
    index:       () => require('./index-cmd'),
    status:      () => require('./status'),
  }
};
