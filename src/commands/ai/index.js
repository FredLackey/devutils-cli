/**
 * AI service registration.
 * AI coding assistant launcher and session management.
 */
module.exports = {
  name: 'ai',
  description: 'AI coding assistant launcher and session management',
  commands: {
    launch:   () => require('./launch'),
    resume:   () => require('./resume'),
    list:     () => require('./list'),
    sessions: () => require('./sessions'),
    show:     () => require('./show'),
    set:      () => require('./set'),
  }
};
