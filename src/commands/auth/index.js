/**
 * Auth service registration.
 * OAuth and credential management.
 */
module.exports = {
  name: 'auth',
  description: 'OAuth and credential management',
  commands: {
    login:   () => require('./login'),
    logout:  () => require('./logout'),
    list:    () => require('./list'),
    status:  () => require('./status'),
    refresh: () => require('./refresh'),
  }
};
