/**
 * Alias service registration.
 * Shorthand bin entries (user-controlled).
 */
module.exports = {
  name: 'alias',
  description: 'Shorthand bin entries (user-controlled)',
  commands: {
    add:    () => require('./add'),
    remove: () => require('./remove'),
    list:   () => require('./list'),
    sync:   () => require('./sync'),
  }
};
