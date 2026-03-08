/**
 * Identity service registration.
 * Git identities, SSH keys, GPG signing.
 */
module.exports = {
  name: 'identity',
  description: 'Git identities, SSH keys, GPG signing',
  commands: {
    add:    () => require('./add'),
    remove: () => require('./remove'),
    list:   () => require('./list'),
    show:   () => require('./show'),
    link:   () => require('./link'),
    unlink: () => require('./unlink'),
    sync:   () => require('./sync'),
  }
};
