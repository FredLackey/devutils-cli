# Story 001: Auth Login and Logout

## Goal
Build the `dev auth login` and `dev auth logout` commands so users can connect DevUtils to external services like Google, AWS, and Cloudflare. Login handles two different authentication flows depending on the service: OAuth (opens a browser for consent) or API key (prompts for credentials directly). Tokens are stored in `~/.devutils/auth/<service>.json`. Logout revokes tokens where possible and deletes the stored credential file. Without these commands, none of the API plugins can function because they all depend on stored auth credentials.

## Prerequisites
- 001-foundation/008 (CLI router)
- 002-config/001 (config init, so `~/.devutils/` and `~/.devutils/auth/` exist)

## Background
DevUtils manages credentials for multiple external services. Each service falls into one of two categories:

**OAuth services** (like Google) use a browser-based consent flow. The user clicks a link, grants permissions, and DevUtils receives an authorization code that it exchanges for access and refresh tokens. OAuth services also support scopes, which limit what permissions the token has. Google OAuth is the main example here because multiple API plugins (Gmail, Drive, Sheets, Docs) all share the same `google` auth service but may request different scopes.

**API key services** (like AWS, Cloudflare, Namecheap, Flowroute, Dokploy, Mailu) use static credentials. The user provides an API key, secret, or token directly. DevUtils stores them in the same `~/.devutils/auth/<service>.json` location, just with a different shape.

The service name in auth commands maps directly to the `auth` field in API plugin contracts. When a plugin declares `auth: 'google'`, the CLI knows to look for `~/.devutils/auth/google.json` and to use the `google` OAuth flow for login.

Client credentials (OAuth client ID and secret) are stored separately in `~/.devutils/auth/clients/<service>.json`. These are the app-level credentials that identify DevUtils to the OAuth provider. They ship with the CLI or are configured by the user.

Reference: `research/proposed/proposed-command-syntax.md` lines 444-468 for the auth syntax. `research/proposed/proposed-package-structure.md` for the `~/.devutils/auth/` directory layout.

## Technique

### Step 1: Define the service registry

Create a lookup object near the top of `login.js` that maps service names to their auth type and configuration. This is the single source of truth for how each service authenticates.

```javascript
const AUTH_SERVICES = {
  google: {
    type: 'oauth',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    revokeUrl: 'https://oauth2.googleapis.com/revoke',
    defaultScopes: ['openid', 'email', 'profile'],
    clientFile: 'google.json'
  },
  aws: {
    type: 'api-key',
    fields: ['accessKeyId', 'secretAccessKey', 'region'],
    fieldLabels: ['AWS Access Key ID', 'AWS Secret Access Key', 'Default Region']
  },
  cloudflare: {
    type: 'api-key',
    fields: ['apiToken'],
    fieldLabels: ['Cloudflare API Token']
  },
  dokploy: {
    type: 'api-key',
    fields: ['apiUrl', 'apiToken'],
    fieldLabels: ['Dokploy API URL', 'Dokploy API Token']
  },
  namecheap: {
    type: 'api-key',
    fields: ['apiUser', 'apiKey', 'clientIp'],
    fieldLabels: ['Namecheap API User', 'API Key', 'Whitelisted Client IP']
  },
  flowroute: {
    type: 'api-key',
    fields: ['accessKey', 'secretKey'],
    fieldLabels: ['Flowroute Access Key', 'Secret Key']
  },
  mailu: {
    type: 'api-key',
    fields: ['apiUrl', 'apiKey'],
    fieldLabels: ['Mailu API URL', 'API Key']
  }
};
```

This list will grow as new services are added, but the structure stays the same. A junior developer adding a new API key service just adds another entry to this object.

### Step 2: Fill in the meta object for login.js

```javascript
const meta = {
  description: 'Authenticate with an external service (OAuth browser flow or API key prompt)',
  arguments: [
    { name: 'service', description: 'Service name to authenticate with (e.g., google, aws, cloudflare)', required: true }
  ],
  flags: [
    { name: 'scopes', type: 'string', description: 'Comma-separated OAuth scopes to request (OAuth services only)' }
  ]
};
```

### Step 3: Implement the login run function

The `run` function should follow this flow:

1. **Validate the service name.** Check if the service exists in `AUTH_SERVICES`. If not, print the list of supported services and exit.

2. **Check for existing credentials.** Read `~/.devutils/auth/<service>.json`. If it exists and contains valid-looking credentials, tell the user they're already authenticated and show basic info (like the email for Google, or a masked API key for key-based services). Ask if they want to re-authenticate. If they say no, exit cleanly. Use `context.prompt.confirm()` for this.

3. **Branch by auth type.**

**For OAuth services:**
- Read the client credentials from `~/.devutils/auth/clients/<service>.json`. If the file doesn't exist, print a helpful error explaining how to set up client credentials and exit.
- Determine the scopes. Start with `defaultScopes` from the service config. If the user passed `--scopes`, parse the comma-separated string and merge those scopes in (don't replace the defaults, add to them).
- Build the authorization URL with the client ID, redirect URI, scopes, and response type.
- Start a temporary local HTTP server on a high port (like 9876) to receive the OAuth callback. This is the redirect URI.
- Open the authorization URL in the user's browser using `context.shell.exec('open <url>')` on macOS, `xdg-open` on Linux, or `start` on Windows. Use `context.platform` to determine which command to use.
- Wait for the callback. When the browser redirects back with the authorization code, the local server captures it.
- Exchange the authorization code for access and refresh tokens by POSTing to the token URL.
- Save the tokens to `~/.devutils/auth/<service>.json` with this shape:

```javascript
{
  type: 'oauth',
  accessToken: '...',
  refreshToken: '...',
  expiresAt: '2026-03-08T14:30:00Z',  // ISO timestamp
  scopes: ['openid', 'email', 'profile', 'https://mail.google.com/'],
  authenticatedAt: '2026-03-08T13:30:00Z'
}
```

**For API key services:**
- Loop through the `fields` array for that service. For each field, prompt the user using `context.prompt.input()` with the corresponding `fieldLabels` entry as the prompt text.
- For fields that look sensitive (contain "secret", "key", "token", or "password" in the name), use `context.prompt.password()` instead so the input is masked.
- Save to `~/.devutils/auth/<service>.json` with this shape:

```javascript
{
  type: 'api-key',
  credentials: {
    accessKeyId: '...',
    secretAccessKey: '...',
    region: 'us-east-1'
  },
  authenticatedAt: '2026-03-08T13:30:00Z'
}
```

4. **Print a success message.** Show the service name and a confirmation that credentials were stored.

### Step 4: Fill in the meta object for logout.js

```javascript
const meta = {
  description: 'Revoke and remove stored credentials for a service',
  arguments: [
    { name: 'service', description: 'Service name to log out from', required: true }
  ],
  flags: []
};
```

### Step 5: Implement the logout run function

1. **Validate the service name** the same way as login.

2. **Check if credentials exist.** Read `~/.devutils/auth/<service>.json`. If the file doesn't exist, tell the user they're not logged into that service and exit.

3. **Attempt token revocation** (for OAuth services only). If the stored credentials have `type: 'oauth'` and the service config has a `revokeUrl`, POST the access token to the revocation endpoint. Wrap this in a try/catch — if revocation fails (network error, token already expired, etc.), log a warning but continue. The local cleanup should always happen.

4. **Delete the credential file.** Use `fs.unlinkSync()` to remove `~/.devutils/auth/<service>.json`.

5. **Print a confirmation.** Tell the user they've been logged out of the service.

### Step 6: Code style

- CommonJS modules (`require` / `module.exports`)
- 2-space indentation, LF line endings
- JSDoc comments on exported functions
- Use `'use strict';` at the top of each file
- Use `context.shell` for running commands, `context.platform` for OS detection
- Use `context.prompt` for all user input — never use `readline` directly
- For HTTP requests (token exchange, revocation), use Node.js built-in `https` module or `context.shell.exec('curl ...')` — no external HTTP libraries

## Files to Create or Modify
- `src/commands/auth/login.js` — Replace the stub with the full login implementation
- `src/commands/auth/logout.js` — Replace the stub with the full logout implementation

## Acceptance Criteria
- [ ] `dev auth login google` opens a browser for OAuth consent and stores tokens in `~/.devutils/auth/google.json`
- [ ] `dev auth login aws` prompts for Access Key ID, Secret Access Key, and Region, then stores them
- [ ] `dev auth login cloudflare` prompts for the API token and stores it
- [ ] `dev auth login google --scopes gmail.readonly,drive.readonly` requests additional scopes beyond the defaults
- [ ] Running login when already authenticated shows current status and asks if the user wants to re-authenticate
- [ ] `dev auth login nonexistent` prints the list of supported services
- [ ] `dev auth logout google` revokes the token and deletes `~/.devutils/auth/google.json`
- [ ] `dev auth logout aws` deletes `~/.devutils/auth/aws.json` (no revocation needed for API keys)
- [ ] `dev auth logout` for a service that isn't authenticated prints "Not logged into <service>"
- [ ] Both commands export `{ meta, run }`
- [ ] Token files are valid JSON with `type`, `authenticatedAt`, and either `accessToken`/`refreshToken` (OAuth) or `credentials` (API key)
- [ ] Sensitive prompt fields (keys, secrets, tokens) are masked during input

## Testing

```bash
# Login to an API key service (easiest to test without OAuth setup)
dev auth login cloudflare
# Expected: Prompts for "Cloudflare API Token" (masked input), then writes ~/.devutils/auth/cloudflare.json

# Verify the token file
cat ~/.devutils/auth/cloudflare.json
# Expected: { "type": "api-key", "credentials": { "apiToken": "..." }, "authenticatedAt": "..." }

# Login again (already authenticated)
dev auth login cloudflare
# Expected: Shows "Already authenticated with cloudflare" and asks to re-authenticate

# Login with unknown service
dev auth login foobar
# Expected: "Unknown service 'foobar'. Supported services: google, aws, cloudflare, ..."

# Logout
dev auth logout cloudflare
# Expected: "Logged out of cloudflare" and ~/.devutils/auth/cloudflare.json is deleted

# Logout when not authenticated
dev auth logout cloudflare
# Expected: "Not logged into cloudflare"

# OAuth flow (requires client credentials to be set up first)
dev auth login google
# Expected: Opens browser, waits for callback, stores tokens

dev auth login google --scopes gmail.readonly
# Expected: Requests gmail.readonly scope in addition to defaults
```

## Notes
- The OAuth local server is temporary. It starts, waits for one callback, and shuts down. Set a timeout (60 seconds is reasonable) so it doesn't hang forever if the user closes the browser without completing the flow.
- For the OAuth redirect URI, use `http://localhost:9876/callback`. The port should be configurable in case 9876 is in use, but default to it. The client credentials file should store the redirect URI so it matches what's registered with the OAuth provider.
- The `--scopes` flag is additive. It adds to the default scopes, not replaces them. This prevents users from accidentally requesting a token without basic profile access.
- When checking for sensitive fields to mask, do a case-insensitive check of the field name against words like "secret", "key", "token", "password". This keeps the logic generic so new services automatically get masked input for their sensitive fields.
- The `authenticatedAt` timestamp is useful for debugging ("when did I set this up?") and for the status command in the next story.
- Don't store the client credentials in the token file. Client credentials stay in `~/.devutils/auth/clients/` and tokens stay in `~/.devutils/auth/`. They're separate concerns.
- If the `~/.devutils/auth/` directory doesn't exist when login runs, create it with `fs.mkdirSync({ recursive: true })`. This handles the case where someone skipped `config init` or deleted the directory.
