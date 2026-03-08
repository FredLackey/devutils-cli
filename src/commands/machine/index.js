/**
 * Machine service registration.
 * Machine profiles and detection.
 */
module.exports = {
  name: 'machine',
  description: 'Machine profiles and detection',
  commands: {
    detect: () => require('./detect'),
    show:   () => require('./show'),
    set:    () => require('./set'),
    list:   () => require('./list'),
  }
};
