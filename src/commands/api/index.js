/**
 * API service registration.
 * API plugin system — manages plugin installation, removal, and updates.
 * Plugin commands are loaded at runtime from ~/.devutils/plugins/.
 */
module.exports = {
  name: 'api',
  description: 'API plugin system',
  commands: {
    list:    () => require('./list'),
    enable:  () => require('./enable'),
    disable: () => require('./disable'),
    update:  () => require('./update'),
  }
};
