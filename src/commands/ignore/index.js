/**
 * Ignore service registration.
 * .gitignore pattern management.
 */
module.exports = {
  name: 'ignore',
  description: '.gitignore pattern management',
  commands: {
    add:    () => require('./add'),
    remove: () => require('./remove'),
    list:   () => require('./list'),
    show:   () => require('./show'),
  }
};
