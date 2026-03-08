/**
 * Config service registration.
 * User configuration and onboarding.
 */
module.exports = {
  name: 'config',
  description: 'User configuration and onboarding',
  commands: {
    init:   () => require('./init'),
    show:   () => require('./show'),
    get:    () => require('./get'),
    set:    () => require('./set'),
    reset:  () => require('./reset'),
    export: () => require('./export'),
    import: () => require('./import'),
  }
};
