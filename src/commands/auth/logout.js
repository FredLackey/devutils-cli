'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { AUTH_SERVICES, AUTH_DIR, readCredential } = require('./services');

const meta = {
  description: 'Revoke and remove stored credentials for a service',
  arguments: [
    { name: 'service', description: 'Service name to log out from', required: true }
  ],
  flags: []
};

/**
 * Attempt to revoke an OAuth token by POSTing to the provider's revocation endpoint.
 * This is best-effort: if revocation fails (network error, token already expired, etc.),
 * we log a warning but continue with local cleanup.
 *
 * @param {string} revokeUrl - The revocation endpoint URL.
 * @param {string} token - The access token to revoke.
 * @returns {Promise<boolean>} True if revocation succeeded, false otherwise.
 */
function revokeToken(revokeUrl, token) {
  return new Promise((resolve) => {
    const postData = new URLSearchParams({ token }).toString();
    const parsed = new URL(revokeUrl);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      // Consume the response body so the socket is released
      res.on('data', () => {});
      res.on('end', () => {
        resolve(res.statusCode >= 200 && res.statusCode < 300);
      });
    });

    req.on('error', () => {
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Run the auth logout command.
 * Validates the service, attempts token revocation for OAuth services,
 * and deletes the local credential file.
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const service = args.positional[0];

  if (!service) {
    context.errors.throwError(400, 'Missing required argument: <service>. Example: dev auth logout google', 'auth');
    return;
  }

  const serviceConfig = AUTH_SERVICES[service];
  if (!serviceConfig) {
    const supported = Object.keys(AUTH_SERVICES).join(', ');
    context.errors.throwError(400, `Unknown service '${service}'. Supported services: ${supported}`, 'auth');
    return;
  }

  // Check if credentials exist
  const credential = readCredential(service);
  if (!credential) {
    context.output.info(`Not logged into ${service}.`);
    return;
  }

  // Attempt token revocation for OAuth services
  if (credential.type === 'oauth' && serviceConfig.revokeUrl && credential.accessToken) {
    context.output.info(`Revoking ${service} token...`);
    const revoked = await revokeToken(serviceConfig.revokeUrl, credential.accessToken);
    if (revoked) {
      context.output.info('Token revoked successfully.');
    } else {
      context.output.info('Warning: Token revocation failed. The token may still be valid on the provider side.');
      context.output.info('Continuing with local cleanup.');
    }
  }

  // Delete the credential file
  const credFile = path.join(AUTH_DIR, `${service}.json`);
  try {
    fs.unlinkSync(credFile);
  } catch {
    // File may have already been deleted -- not an error
  }

  context.output.info(`Logged out of ${service}.`);
}

module.exports = { meta, run };
