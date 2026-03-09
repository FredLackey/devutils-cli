'use strict';

const { AUTH_SERVICES, readCredential, getTokenStatus } = require('./services');

const meta = {
  description: 'List all connected services and their token status',
  arguments: [],
  flags: []
};

/**
 * Run the auth list command.
 * Scans all known services from AUTH_SERVICES and shows their auth status.
 * Shows 'valid', 'expired', or 'missing' for each service.
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const services = Object.keys(AUTH_SERVICES);
  const results = [];

  for (const service of services) {
    const config = AUTH_SERVICES[service];
    const credential = readCredential(service);
    const status = getTokenStatus(credential);

    results.push({
      service: service,
      type: config.type,
      status: status,
      authenticatedAt: credential && credential.authenticatedAt ? credential.authenticatedAt : '-'
    });
  }

  // Check if any services are connected
  const hasConnected = results.some(r => r.status !== 'missing');

  if (!hasConnected) {
    context.output.info('No services authenticated. Run "dev auth login <service>" to connect.');
    context.output.info('');
    context.output.info('Available services: ' + services.join(', '));
    return;
  }

  context.output.out(results);
}

module.exports = { meta, run };
