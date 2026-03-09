'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { AUTH_SERVICES, AUTH_DIR, CLIENTS_DIR, readCredential } = require('./services');

const meta = {
  description: 'Force a token refresh for an OAuth service without re-authenticating',
  arguments: [
    { name: 'service', description: 'Service name to refresh', required: true }
  ],
  flags: []
};

/**
 * Make an HTTPS POST request with form-encoded data.
 * Uses Node.js built-in https module (no external dependencies).
 *
 * @param {string} targetUrl - The URL to POST to.
 * @param {Object<string, string>} data - Key/value pairs to send as form data.
 * @returns {Promise<{ statusCode: number, body: string }>}
 */
function httpsPost(targetUrl, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const parsed = new URL(targetUrl);

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
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Run the auth refresh command.
 * Exchanges the stored refresh token for a new access token and updates
 * the credential file. Only works for OAuth services.
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const service = args.positional[0];

  if (!service) {
    context.errors.throwError(400, 'Missing required argument: <service>. Example: dev auth refresh google', 'auth');
    return;
  }

  const serviceConfig = AUTH_SERVICES[service];
  if (!serviceConfig) {
    const supported = Object.keys(AUTH_SERVICES).join(', ');
    context.errors.throwError(400, `Unknown service '${service}'. Supported services: ${supported}`, 'auth');
    return;
  }

  // Read existing credentials
  const credential = readCredential(service);
  if (!credential) {
    context.output.info(`Not authenticated with ${service}. Run "dev auth login ${service}" to authenticate first.`);
    return;
  }

  // API key services don't support refresh
  if (credential.type === 'api-key') {
    context.output.info('Refresh is not applicable for API key services. API keys don\'t expire through DevUtils.');
    return;
  }

  // OAuth services need a refresh token
  if (credential.type !== 'oauth') {
    context.output.info(`Unrecognized credential type: ${credential.type}`);
    return;
  }

  if (!credential.refreshToken) {
    context.output.info(`No refresh token available for ${service}. Run "dev auth login ${service}" to re-authenticate.`);
    return;
  }

  // Read client credentials
  if (!serviceConfig.clientFile) {
    context.errors.throwError(500, `No client credentials file configured for ${service}.`, 'auth');
    return;
  }

  const clientFile = path.join(CLIENTS_DIR, serviceConfig.clientFile);
  if (!fs.existsSync(clientFile)) {
    context.output.info(`Client credentials not found: ${clientFile}`);
    context.output.info(`Cannot refresh without client credentials. Run "dev auth login ${service}" to re-authenticate.`);
    return;
  }

  let clientCreds;
  try {
    clientCreds = JSON.parse(fs.readFileSync(clientFile, 'utf8'));
  } catch {
    context.errors.throwError(500, `Invalid client credentials file: ${clientFile}`, 'auth');
    return;
  }

  if (!clientCreds.clientId || !clientCreds.clientSecret) {
    context.errors.throwError(400, 'Client credentials file must contain "clientId" and "clientSecret".', 'auth');
    return;
  }

  // Exchange refresh token for new access token
  context.output.info(`Refreshing ${service} token...`);

  let tokenResponse;
  try {
    tokenResponse = await httpsPost(serviceConfig.tokenUrl, {
      grant_type: 'refresh_token',
      refresh_token: credential.refreshToken,
      client_id: clientCreds.clientId,
      client_secret: clientCreds.clientSecret
    });
  } catch (err) {
    context.errors.throwError(500, `Token refresh failed: ${err.message}`, 'auth');
    return;
  }

  let tokenData;
  try {
    tokenData = JSON.parse(tokenResponse.body);
  } catch {
    context.errors.throwError(500, 'Failed to parse token refresh response.', 'auth');
    return;
  }

  if (tokenData.error) {
    context.errors.throwError(500, `Token refresh error: ${tokenData.error_description || tokenData.error}`, 'auth');
    return;
  }

  // Update the credential file with the new token
  const now = new Date();
  const expiresAt = tokenData.expires_in
    ? new Date(now.getTime() + tokenData.expires_in * 1000).toISOString()
    : credential.expiresAt;

  const updated = {
    type: 'oauth',
    accessToken: tokenData.access_token,
    // Some providers return a new refresh token, some don't.
    // If a new one is returned, use it. Otherwise, keep the old one.
    refreshToken: tokenData.refresh_token || credential.refreshToken,
    expiresAt: expiresAt,
    scopes: credential.scopes,
    authenticatedAt: credential.authenticatedAt
  };

  fs.writeFileSync(
    path.join(AUTH_DIR, `${service}.json`),
    JSON.stringify(updated, null, 2) + '\n'
  );

  context.output.info(`Token refreshed successfully for ${service}.`);
  if (expiresAt) {
    context.output.info(`New expiry: ${expiresAt}`);
  }
}

module.exports = { meta, run };
