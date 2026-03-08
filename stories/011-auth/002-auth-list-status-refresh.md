# Story 002: Auth List, Status, and Refresh

## Goal
Build three supporting auth commands: `dev auth list`, `dev auth status`, and `dev auth refresh`. Together with login and logout from the previous story, these complete the `dev auth` service. `list` gives you a quick overview of all connected services so you can see what's authenticated and what's expired at a glance. `status` digs deeper into one service, showing scopes, expiry time, and account details. `refresh` forces a token refresh for OAuth services without making the user go through the whole login flow again. These commands read from `~/.devutils/auth/` and are the primary way users (and AI agents) check whether auth is in good shape before running API commands.

## Prerequisites
- 011-auth/001 (auth login and logout, so there are credential files to read)

## Background
After the user logs into one or more services with `dev auth login`, they need ways to check on those credentials. Tokens expire. Scopes change. Users forget which services they've connected. These three commands cover those needs.

The credential files in `~/.devutils/auth/` come in two shapes, both established in the previous story:

**OAuth tokens** (`type: 'oauth'`): Have `accessToken`, `refreshToken`, `expiresAt`, `scopes`, and `authenticatedAt`. The `expiresAt` field is an ISO timestamp. If the current time is past `expiresAt`, the token is expired and needs refreshing.

**API keys** (`type: 'api-key'`): Have `credentials` (an object with service-specific fields) and `authenticatedAt`. API keys don't expire on their own (though some services might rotate them externally). For our purposes, API key services are always "valid" as long as the file exists and has content.

The list of known services lives in the `AUTH_SERVICES` object defined in `login.js`. Import or duplicate it so these commands know which services to scan for. Better yet, extract it into a shared file (like `src/lib/auth-services.js` or just keep it as a constant in the auth index) so all auth commands reference the same list.

## Technique

### Step 1: Extract the shared service registry

Before building the three commands, pull the `AUTH_SERVICES` object out of `login.js` and into a shared location that all auth commands can import. A good place is a new file at `src/commands/auth/services.js` that just exports the object. Update `login.js` to import from there. This avoids duplicating the service list across four files.

```javascript
// src/commands/auth/services.js
'use strict';

const AUTH_SERVICES = {
  google: { type: 'oauth', /* ... same as login.js ... */ },
  aws: { type: 'api-key', /* ... */ },
  // ... rest of services
};

module.exports = { AUTH_SERVICES };
```

### Step 2: Build a shared helper to read a credential file

Create a small helper function (either in `services.js` or inline in each command) that reads a credential file and returns its parsed contents, or `null` if the file doesn't exist or is invalid JSON.

```javascript
function readCredential(service) {
  const filePath = path.join(os.homedir(), '.devutils', 'auth', `${service}.json`);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}
```

Also create a helper to determine token status:

```javascript
function getTokenStatus(credential) {
  if (!credential) return 'missing';
  if (credential.type === 'api-key') return 'valid';
  if (credential.type === 'oauth') {
    if (!credential.expiresAt) return 'unknown';
    return new Date(credential.expiresAt) > new Date() ? 'valid' : 'expired';
  }
  return 'unknown';
}
```

### Step 3: Implement list.js

Fill in the meta:

```javascript
const meta = {
  description: 'List all connected services and their token status',
  arguments: [],
  flags: []
};
```

In the `run` function:

1. Get the list of all known service names from `AUTH_SERVICES`.
2. For each service, call `readCredential(service)` and `getTokenStatus()`.
3. Build an array of result objects: `{ service, type, status, authenticatedAt }`.
4. Pass the array to `context.output.render()`.

For human-readable output, format it as a table:

```
Service       Type      Status    Authenticated
google        oauth     valid     2026-03-01T12:00:00Z
aws           api-key   valid     2026-03-05T08:30:00Z
cloudflare    api-key   missing   -
dokploy       api-key   missing   -
```

For JSON output, return the full array of objects.

If no services are connected at all (every status is `missing`), print a message: "No services authenticated. Run `dev auth login <service>` to connect."

### Step 4: Implement status.js

Fill in the meta:

```javascript
const meta = {
  description: 'Show detailed auth state for one service',
  arguments: [
    { name: 'service', description: 'Service name to check', required: true }
  ],
  flags: []
};
```

In the `run` function:

1. Validate the service name against `AUTH_SERVICES`. If unknown, print the list and exit.
2. Read the credential file.
3. If no credentials found, print "Not authenticated with <service>. Run `dev auth login <service>`." and exit.
4. Build a detailed status object based on the credential type.

**For OAuth credentials:**
```javascript
{
  service: 'google',
  type: 'oauth',
  status: 'valid',           // or 'expired'
  scopes: ['openid', 'email', 'profile', 'https://mail.google.com/'],
  expiresAt: '2026-03-08T14:30:00Z',
  expiresIn: '47 minutes',   // human-readable time until expiry
  authenticatedAt: '2026-03-08T13:30:00Z',
  hasRefreshToken: true
}
```

Calculate `expiresIn` by comparing `expiresAt` to the current time. If already expired, show a negative like "expired 12 minutes ago". Use simple math on the date difference and format it as a readable string (hours, minutes, or days depending on the magnitude).

**For API key credentials:**
```javascript
{
  service: 'aws',
  type: 'api-key',
  status: 'valid',
  fields: ['accessKeyId', 'secretAccessKey', 'region'],
  maskedValues: {
    accessKeyId: 'AKIA...XYZ',
    secretAccessKey: '****',
    region: 'us-east-1'
  },
  authenticatedAt: '2026-03-05T08:30:00Z'
}
```

For masking: show the first 4 and last 3 characters of non-sensitive fields like `accessKeyId`. Show `****` for sensitive fields (anything with "secret", "key", "token", or "password" in the field name). Show non-sensitive values like `region` in full.

5. Pass to `context.output.render()`.

### Step 5: Implement refresh.js

Fill in the meta:

```javascript
const meta = {
  description: 'Force a token refresh for an OAuth service without re-authenticating',
  arguments: [
    { name: 'service', description: 'Service name to refresh', required: true }
  ],
  flags: []
};
```

In the `run` function:

1. Validate the service name.
2. Read the credential file.
3. If no credentials found, print "Not authenticated with <service>" and exit.
4. If the credential type is `api-key`, print "Refresh is not applicable for API key services. API keys don't expire through DevUtils." and exit.
5. If the credential type is `oauth`, check for a `refreshToken`. If missing, print "No refresh token available. Run `dev auth login <service>` to re-authenticate." and exit.
6. Read the client credentials from `~/.devutils/auth/clients/<service>.json`. If missing, print an error about missing client credentials.
7. POST to the service's token URL with `grant_type=refresh_token`, the refresh token, client ID, and client secret.
8. Parse the response. Update the credential file with the new `accessToken`, new `expiresAt`, and keep the existing `refreshToken` (some providers return a new refresh token, some don't — if a new one is returned, use it).
9. Write the updated credential file.
10. Print a success message showing the new expiry time.

Use Node.js built-in `https` module for the HTTP request, same approach as login.

## Files to Create or Modify
- `src/commands/auth/services.js` — New file. Shared service registry and credential helpers.
- `src/commands/auth/list.js` — Replace the stub with the list implementation.
- `src/commands/auth/status.js` — Replace the stub with the status implementation.
- `src/commands/auth/refresh.js` — Replace the stub with the refresh implementation.
- `src/commands/auth/login.js` — Update to import from `services.js` instead of defining `AUTH_SERVICES` inline.

## Acceptance Criteria
- [ ] `dev auth list` shows all known services with their auth type and status (valid, expired, or missing)
- [ ] `dev auth list` with no authenticated services prints a helpful message
- [ ] `dev auth list` outputs a structured array for JSON consumers
- [ ] `dev auth status google` shows scopes, expiry time, time remaining, and whether a refresh token exists
- [ ] `dev auth status aws` shows the credential fields with sensitive values masked
- [ ] `dev auth status nonexistent` prints the list of supported services
- [ ] `dev auth status cloudflare` when not authenticated says "Not authenticated" with login instructions
- [ ] `dev auth refresh google` exchanges the refresh token for a new access token and updates the file
- [ ] `dev auth refresh aws` prints a message explaining refresh doesn't apply to API key services
- [ ] `dev auth refresh google` when no refresh token exists tells the user to re-login
- [ ] All three commands export `{ meta, run }`
- [ ] The shared `AUTH_SERVICES` object is imported from a single location

## Testing

```bash
# Set up some test credentials first
dev auth login cloudflare
dev auth login aws

# List all services
dev auth list
# Expected: Table showing cloudflare (api-key, valid), aws (api-key, valid), google (missing), etc.

dev auth list --format json
# Expected: JSON array of { service, type, status, authenticatedAt }

# Status for an API key service
dev auth status aws
# Expected: Shows fields, masked values, and authenticated timestamp

# Status for a missing service
dev auth status google
# Expected: "Not authenticated with google. Run `dev auth login google`."

# Status for an unknown service
dev auth status foobar
# Expected: "Unknown service 'foobar'. Supported services: ..."

# Refresh an API key service
dev auth refresh aws
# Expected: "Refresh is not applicable for API key services..."

# Refresh without being authenticated
dev auth refresh google
# Expected: "Not authenticated with google"
```

## Notes
- The `expiresIn` calculation is for human display only. Don't put it in the credential file. Calculate it fresh every time status is called.
- When masking values for status output, apply the same sensitivity heuristic used in login: check if the field name contains "secret", "key", "token", or "password" (case-insensitive). Mask those fully. Show partial values for identifiers like account IDs. Show full values for non-sensitive config like region.
- The list command should scan for all known services from `AUTH_SERVICES`, not scan the filesystem. This means it shows "missing" for services the user hasn't connected to yet. This is more useful than only showing connected services because it answers "what can I connect to?" in addition to "what am I connected to?".
- For the refresh command, Google's token endpoint returns the new access token and expiry but usually does NOT return a new refresh token. Keep the old refresh token in that case. However, if the response does include a `refresh_token` field, save the new one. This handles both behaviors correctly.
- If the credential file exists but is malformed JSON, treat it as "missing" in list and status, and print a warning suggesting the user re-login.
