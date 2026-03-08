/**
 * Util service registration.
 * Complex utility functions (platform-aware).
 */
module.exports = {
  name: 'util',
  description: 'Complex utility functions (platform-aware)',
  commands: {
    run:    () => require('./run'),
    list:   () => require('./list'),
    show:   () => require('./show'),
    add:    () => require('./add'),
    remove: () => require('./remove'),
  }
};
