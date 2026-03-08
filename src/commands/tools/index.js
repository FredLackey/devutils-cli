/**
 * Tools service registration.
 * Tool installation and management.
 */
module.exports = {
  name: 'tools',
  description: 'Tool installation and management',
  commands: {
    install: () => require('./install'),
    check:   () => require('./check'),
    list:    () => require('./list'),
    search:  () => require('./search'),
  }
};
