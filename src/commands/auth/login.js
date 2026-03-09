'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const url = require('url');
const { AUTH_SERVICES, AUTH_DIR, CLIENTS_DIR, readCredential, isSensitiveField } = require('./services');
const platform = require('../../lib/platform');

const OAUTH_PORT = 9876;
const OAUTH_REDIRECT_URI = `http://localhost:${OAUTH_PORT}/callback`;
const OAUTH_TIMEOUT_MS = 60000;

const meta = {
  description: 'Authenticate with an external service (OAuth browser flow or API key prompt)',
  arguments: [
    { name: 'service', description: 'Service name to authenticate with (e.g., google, aws, cloudflare)', required: true }
  ],
  flags: [
    { name: 'scopes', type: 'string', description: 'Comma-separated OAuth scopes to request (OAuth services only)' }
  ]
};

/**
 * Open a URL in the user's default browser.
 * Uses the appropriate command for the detected OS.
 *
 * @param {string} targetUrl - The URL to open.
 * @returns {Promise<void>}
 */
async function openBrowser(targetUrl) {
  const shell = require('../../lib/shell');
  const plat = platform.detect();
  let cmd;

  if (plat.type === 'macos') {
    cmd = `open "${targetUrl}"`;
  } else if (plat.type === 'windows' || plat.type === 'gitbash') {
    cmd = `start "" "${targetUrl}"`;
  } else {
    // Linux variants
    cmd = `xdg-open "${targetUrl}"`;
  }

  await shell.exec(cmd);
}

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
 * Start a temporary local HTTP server to capture the OAuth callback.
 * The server listens on OAUTH_PORT, waits for the authorization code,
 * and shuts down after receiving it (or after a timeout).
 *
 * @returns {Promise<string>} The authorization code from the callback.
 */
function waitForOAuthCallback() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url, true);

      if (parsed.pathname === '/callback') {
        const code = parsed.query.code;
        const error = parsed.query.error;

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Authentication failed</h2><p>You can close this window.</p></body></html>');
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h2>Authentication successful!</h2><p>You can close this window and return to the terminal.</p></body></html>');
          server.close();
          resolve(code);
          return;
        }

        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing authorization code.');
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found.');
      }
    });

    // Set a timeout so the server doesn't hang forever
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error('OAuth callback timed out. Please try again.'));
    }, OAUTH_TIMEOUT_MS);

    server.on('close', () => {
      clearTimeout(timeout);
    });

    server.listen(OAUTH_PORT, () => {
      // Server is ready; the caller will open the browser
    });
  });
}

/**
 * Handle OAuth login flow for a service (e.g., Google).
 * Opens the browser for consent, waits for the callback, exchanges the
 * authorization code for tokens, and saves them to disk.
 *
 * @param {string} service - The service name.
 * @param {object} serviceConfig - The service config from AUTH_SERVICES.
 * @param {object} args - Parsed CLI arguments.
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function handleOAuthLogin(service, serviceConfig, args, context) {
  // Read client credentials
  const clientFile = path.join(CLIENTS_DIR, serviceConfig.clientFile);
  if (!fs.existsSync(clientFile)) {
    context.output.info(`Client credentials not found: ${clientFile}`);
    context.output.info('');
    context.output.info('To set up OAuth for this service:');
    context.output.info(`  1. Create a client credentials file at ${clientFile}`);
    context.output.info('  2. Include "clientId" and "clientSecret" fields');
    context.output.info('  3. Run this command again');
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

  // Build scopes: start with defaults, add any from --scopes flag
  const scopes = [...serviceConfig.defaultScopes];
  if (args.flags.scopes) {
    const extra = args.flags.scopes.split(',').map(s => s.trim()).filter(Boolean);
    for (const scope of extra) {
      if (!scopes.includes(scope)) {
        scopes.push(scope);
      }
    }
  }

  // Determine redirect URI (use client file value if set, otherwise default)
  const redirectUri = clientCreds.redirectUri || OAUTH_REDIRECT_URI;

  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: clientCreds.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `${serviceConfig.authUrl}?${authParams.toString()}`;

  context.output.info('Opening browser for authentication...');
  context.output.info('If the browser does not open, visit this URL:');
  context.output.info('');
  context.output.info(`  ${authUrl}`);
  context.output.info('');

  // Start the callback server and open the browser
  const callbackPromise = waitForOAuthCallback();
  await openBrowser(authUrl);

  let code;
  try {
    code = await callbackPromise;
  } catch (err) {
    context.errors.throwError(500, err.message, 'auth');
    return;
  }

  // Exchange authorization code for tokens
  context.output.info('Exchanging authorization code for tokens...');

  let tokenResponse;
  try {
    tokenResponse = await httpsPost(serviceConfig.tokenUrl, {
      code: code,
      client_id: clientCreds.clientId,
      client_secret: clientCreds.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });
  } catch (err) {
    context.errors.throwError(500, `Token exchange failed: ${err.message}`, 'auth');
    return;
  }

  let tokenData;
  try {
    tokenData = JSON.parse(tokenResponse.body);
  } catch {
    context.errors.throwError(500, 'Failed to parse token response.', 'auth');
    return;
  }

  if (tokenData.error) {
    context.errors.throwError(500, `Token error: ${tokenData.error_description || tokenData.error}`, 'auth');
    return;
  }

  // Calculate expiry time
  const now = new Date();
  const expiresAt = tokenData.expires_in
    ? new Date(now.getTime() + tokenData.expires_in * 1000).toISOString()
    : null;

  // Save tokens
  const credential = {
    type: 'oauth',
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    expiresAt: expiresAt,
    scopes: scopes,
    authenticatedAt: now.toISOString()
  };

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(AUTH_DIR, `${service}.json`),
    JSON.stringify(credential, null, 2) + '\n'
  );

  context.output.info('');
  context.output.info(`Successfully authenticated with ${service}.`);
  context.output.info(`Credentials stored in ~/.devutils/auth/${service}.json`);
}

/**
 * Handle API key login flow for a service (e.g., AWS, Cloudflare).
 * Prompts the user for each required field and saves them to disk.
 *
 * @param {string} service - The service name.
 * @param {object} serviceConfig - The service config from AUTH_SERVICES.
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function handleApiKeyLogin(service, serviceConfig, context) {
  const credentials = {};

  for (let i = 0; i < serviceConfig.fields.length; i++) {
    const field = serviceConfig.fields[i];
    const label = serviceConfig.fieldLabels[i];

    if (isSensitiveField(field)) {
      credentials[field] = await context.prompt.password(label);
    } else {
      credentials[field] = await context.prompt.ask(label, '');
    }

    if (!credentials[field]) {
      context.errors.throwError(400, `${label} is required.`, 'auth');
      return;
    }
  }

  const credential = {
    type: 'api-key',
    credentials: credentials,
    authenticatedAt: new Date().toISOString()
  };

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(AUTH_DIR, `${service}.json`),
    JSON.stringify(credential, null, 2) + '\n'
  );

  context.output.info('');
  context.output.info(`Successfully authenticated with ${service}.`);
  context.output.info(`Credentials stored in ~/.devutils/auth/${service}.json`);
}

/**
 * Run the auth login command.
 * Validates the service name, checks for existing credentials, and branches
 * into the appropriate auth flow (OAuth or API key).
 *
 * @param {object} args - Parsed CLI arguments (positional, flags).
 * @param {object} context - CLI context (output, prompt, errors).
 */
async function run(args, context) {
  const service = args.positional[0];

  if (!service) {
    context.errors.throwError(400, 'Missing required argument: <service>. Example: dev auth login google', 'auth');
    return;
  }

  const serviceConfig = AUTH_SERVICES[service];
  if (!serviceConfig) {
    const supported = Object.keys(AUTH_SERVICES).join(', ');
    context.errors.throwError(400, `Unknown service '${service}'. Supported services: ${supported}`, 'auth');
    return;
  }

  // Check for existing credentials
  const existing = readCredential(service);
  if (existing) {
    context.output.info(`Already authenticated with ${service}.`);

    if (existing.type === 'api-key' && existing.credentials) {
      // Show a masked preview of the existing credentials
      const fields = Object.keys(existing.credentials);
      for (const field of fields) {
        const val = existing.credentials[field];
        if (isSensitiveField(field)) {
          context.output.info(`  ${field}: ****`);
        } else {
          context.output.info(`  ${field}: ${val}`);
        }
      }
    }

    if (existing.authenticatedAt) {
      context.output.info(`  Authenticated: ${existing.authenticatedAt}`);
    }

    const reauth = await context.prompt.confirm('Do you want to re-authenticate?', false);
    if (!reauth) {
      return;
    }
  }

  // Branch by auth type
  if (serviceConfig.type === 'oauth') {
    await handleOAuthLogin(service, serviceConfig, args, context);
  } else if (serviceConfig.type === 'api-key') {
    await handleApiKeyLogin(service, serviceConfig, context);
  }
}

module.exports = { meta, run };
