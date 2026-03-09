'use strict';

const {
  AUTH_SERVICES,
  readCredential,
  getTokenStatus,
  isSensitiveField,
  maskValue,
  formatTimeDiff
} = require('./services');

const meta = {
  description: 'Show detailed auth state for one service',
  arguments: [
    { name: 'service', description: 'Service name to check', required: true }
  ],
  flags: []
};

/**
 * Run the auth status command.
 * Shows detailed credential information for a single service, including
 * scopes and expiry for OAuth, or masked field values for API key services.
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const service = args.positional[0];

  if (!service) {
    context.errors.throwError(400, 'Missing required argument: <service>. Example: dev auth status google', 'auth');
    return;
  }

  const serviceConfig = AUTH_SERVICES[service];
  if (!serviceConfig) {
    const supported = Object.keys(AUTH_SERVICES).join(', ');
    context.errors.throwError(400, `Unknown service '${service}'. Supported services: ${supported}`, 'auth');
    return;
  }

  const credential = readCredential(service);
  if (!credential) {
    context.output.info(`Not authenticated with ${service}. Run "dev auth login ${service}" to connect.`);
    return;
  }

  const status = getTokenStatus(credential);

  if (credential.type === 'oauth') {
    // Build detailed OAuth status
    const now = new Date();
    let expiresIn = null;

    if (credential.expiresAt) {
      expiresIn = formatTimeDiff(new Date(credential.expiresAt), now);
    }

    const result = {
      service: service,
      type: 'oauth',
      status: status,
      scopes: credential.scopes || [],
      expiresAt: credential.expiresAt || '-',
      expiresIn: expiresIn || '-',
      authenticatedAt: credential.authenticatedAt || '-',
      hasRefreshToken: !!credential.refreshToken
    };

    context.output.out(result);
  } else if (credential.type === 'api-key') {
    // Build detailed API key status with masked values
    const fields = credential.credentials ? Object.keys(credential.credentials) : [];
    const maskedValues = {};

    for (const field of fields) {
      const val = credential.credentials[field];
      if (isSensitiveField(field)) {
        // Fully mask sensitive fields
        maskedValues[field] = maskValue(val, true);
      } else {
        // Show non-sensitive values in full (like region)
        maskedValues[field] = val;
      }
    }

    const result = {
      service: service,
      type: 'api-key',
      status: status,
      fields: fields,
      maskedValues: maskedValues,
      authenticatedAt: credential.authenticatedAt || '-'
    };

    context.output.out(result);
  } else {
    // Unknown credential type
    context.output.info(`Credential file exists for ${service} but has an unrecognized type: ${credential.type}`);
  }
}

module.exports = { meta, run };
