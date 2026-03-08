# Story 009: Build the Namecheap API Plugin

## Goal
Build the Namecheap plugin as a separate git repo and npm package (`@fredlackey/devutils-api-namecheap`). It wraps the Namecheap API into 8 commands across 3 resources: domains (list/get/check), dns (list/set/delete), and ssl (list/get). Auth service: `namecheap`. This plugin is unique because Namecheap uses an XML API, not JSON, so the plugin needs to parse XML responses.

## Prerequisites
- 017-api-plugins/001 (plugin template)
- 011-auth/001 (auth service)

## Background
Namecheap's API is older-style XML over HTTPS. All requests go to `https://api.namecheap.com/xml.response` as GET requests with query parameters. Authentication uses three values: `ApiUser`, `ApiKey`, and `ClientIp`. These are passed as query parameters on every request.

The API returns XML responses. The plugin needs to parse these into JSON before passing them to `context.output`. You can use a lightweight XML parser or write a minimal parser for the specific response shapes Namecheap returns.

Command signatures are defined in `research/proposed/proposed-command-syntax.md` lines 1051-1094.

### Namecheap API Endpoint Mapping

| Command | API Command Parameter | Description |
|---------|---------------------|-------------|
| domains list | namecheap.domains.getList | List all domains |
| domains get | namecheap.domains.getInfo | Get domain registration details |
| domains check | namecheap.domains.check | Check domain availability |
| dns list | namecheap.domains.dns.getHosts | List DNS host records |
| dns set | namecheap.domains.dns.setHosts | Set DNS host records (replaces all) |
| dns delete | namecheap.domains.dns.setHosts | Remove specific record (re-set without it) |
| ssl list | namecheap.ssl.getList | List SSL certificates |
| ssl get | namecheap.ssl.getInfo | Get SSL certificate details |

All Namecheap API calls use the same URL. The `Command` query parameter determines which action is performed.

## Technique

### Step 1: Create the repo and scaffold

1. Create the repo at `git@github.com:FredLackey/devutils-api-namecheap.git`.
2. Copy and customize the plugin template: `<service>` -> `namecheap`, auth -> `namecheap`.
3. No SDK dependencies. Use Node.js built-in `https` for HTTP and a minimal XML parser.

### Step 2: Set up `index.js`

```javascript
module.exports = {
  name: 'namecheap',
  description: 'Namecheap (domains, DNS, SSL certificates)',
  version: '1.0.0',
  auth: 'namecheap',
  resources: {
    domains: {
      description: 'Domain registrations',
      commands: {
        list:  () => require('./commands/domains/list'),
        get:   () => require('./commands/domains/get'),
        check: () => require('./commands/domains/check'),
      }
    },
    dns: {
      description: 'DNS host records',
      commands: {
        list:   () => require('./commands/dns/list'),
        set:    () => require('./commands/dns/set'),
        delete: () => require('./commands/dns/delete'),
      }
    },
    ssl: {
      description: 'SSL certificates',
      commands: {
        list: () => require('./commands/ssl/list'),
        get:  () => require('./commands/ssl/get'),
      }
    }
  }
};
```

### Step 3: Create the shared helper

Create `commands/_helpers.js`. This handles the XML API and XML parsing:

```javascript
const https = require('https');

const API_URL = 'https://api.namecheap.com/xml.response';

/**
 * Make a request to the Namecheap XML API.
 * @param {string} command - Namecheap API command (e.g., 'namecheap.domains.getList')
 * @param {object} context - Core CLI context
 * @param {object} [extraParams] - Additional query parameters
 * @returns {Promise<object>} Parsed response
 */
function request(command, context, extraParams) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      ApiUser: context.auth.apiUser,
      ApiKey: context.auth.apiKey,
      UserName: context.auth.apiUser,
      ClientIp: context.auth.clientIp,
      Command: command,
      ...extraParams
    });

    const url = `${API_URL}?${params.toString()}`;
    const parsed = new URL(url);

    https.get({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = parseXml(data);
          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse API response: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Minimal XML parser for Namecheap responses.
 * Extracts attributes and text content from XML elements.
 * This is not a general-purpose XML parser -- it handles the specific
 * shapes that Namecheap returns.
 */
function parseXml(xml) {
  // Check for API errors
  const statusMatch = xml.match(/Status="(\w+)"/);
  const status = statusMatch ? statusMatch[1] : 'UNKNOWN';

  if (status === 'ERROR') {
    const errorMatch = xml.match(/<Error Number="(\d+)">(.*?)<\/Error>/s);
    const code = errorMatch ? parseInt(errorMatch[1]) : 0;
    const message = errorMatch ? errorMatch[2].trim() : 'Unknown API error';
    return { success: false, error: { code, message } };
  }

  // Extract the CommandResponse content
  const responseMatch = xml.match(/<CommandResponse.*?>([\s\S]*?)<\/CommandResponse>/);
  const responseContent = responseMatch ? responseMatch[1] : '';

  // Parse elements with attributes into objects
  const items = [];
  const elementRegex = /<(\w+)\s+([^>]*?)\/?>(?:([\s\S]*?)<\/\1>)?/g;
  let match;
  while ((match = elementRegex.exec(responseContent)) !== null) {
    const attrs = {};
    const attrRegex = /(\w+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(match[2])) !== null) {
      attrs[attrMatch[1]] = attrMatch[2];
    }
    if (match[3]) {
      attrs._text = match[3].trim();
    }
    items.push({ element: match[1], ...attrs });
  }

  return { success: true, items };
}

module.exports = { request, parseXml };
```

### Step 4: Implement each command

Create the directory structure:
```
commands/
├── _helpers.js
├── domains/
│   ├── list.js        # --limit flag
│   ├── get.js         # <domain> argument
│   └── check.js       # <domain> argument
├── dns/
│   ├── list.js        # <domain> argument
│   ├── set.js         # <domain> argument, records via --json flag
│   └── delete.js      # <domain> and <record-id> arguments, --confirm flag
└── ssl/
    ├── list.js        # --limit flag
    └── get.js         # <cert-id> argument
```

Key implementation details:

- **domains list**: Calls `namecheap.domains.getList` with optional `PageSize` param. Parse the `DomainGetListResult` elements.

- **domains get**: Calls `namecheap.domains.getInfo` with `DomainName` param. Returns registration info, expiry date, nameservers, etc.

- **domains check**: Calls `namecheap.domains.check` with `DomainList` param. Returns availability and pricing info.

- **dns list**: Calls `namecheap.domains.dns.getHosts` with `SLD` and `TLD` params. The domain name must be split into SLD (second-level domain) and TLD (top-level domain). For `example.com`, SLD is `example` and TLD is `com`. For `example.co.uk`, SLD is `example` and TLD is `co.uk`.

- **dns set**: Calls `namecheap.domains.dns.setHosts`. This replaces ALL host records. The user passes the full record set via `--json`. The JSON shape should be an array of records: `[{ HostName, RecordType, Address, TTL }]`. Each record becomes query parameters like `HostName1`, `RecordType1`, `Address1`, etc.

- **dns delete**: There is no delete endpoint in Namecheap. To delete a record, you: (1) fetch the current records with `dns.getHosts`, (2) remove the target record from the list, (3) re-set the remaining records with `dns.setHosts`. This is a multi-step operation and requires `--confirm` because a mistake could wipe all DNS records.

- **ssl list**: Calls `namecheap.ssl.getList`. Parse the certificate elements.

- **ssl get**: Calls `namecheap.ssl.getInfo` with `CertificateID` param. Returns detailed certificate info.

### Step 5: Publish

Verify with `npm pack --dry-run`, then `npm publish --access public`.

## Files to Create or Modify
- `package.json` -- New file. Package metadata.
- `index.js` -- New file. Plugin contract with 3 resources and 8 command loaders.
- `commands/_helpers.js` -- New file. HTTP client and XML parser for Namecheap API.
- `commands/domains/list.js` -- New file.
- `commands/domains/get.js` -- New file.
- `commands/domains/check.js` -- New file.
- `commands/dns/list.js` -- New file.
- `commands/dns/set.js` -- New file.
- `commands/dns/delete.js` -- New file.
- `commands/ssl/list.js` -- New file.
- `commands/ssl/get.js` -- New file.
- `README.md` -- New file.
- `.gitignore` -- New file.

## Acceptance Criteria
- [ ] The plugin repo exists at `git@github.com:FredLackey/devutils-api-namecheap.git`
- [ ] `index.js` exports the correct contract with `name: 'namecheap'`, `auth: 'namecheap'`
- [ ] All 8 command files exist and export `{ meta, run }`
- [ ] `dev api enable namecheap` installs the plugin
- [ ] `dev api namecheap domains list` lists domains
- [ ] `dev api namecheap domains check example.com` checks availability
- [ ] `dev api namecheap dns list example.com` lists DNS records
- [ ] `dev api namecheap ssl list` lists SSL certificates
- [ ] `dev schema api.namecheap` lists all 3 resources
- [ ] XML responses are parsed into JSON before output
- [ ] API errors from Namecheap are mapped to structured errors
- [ ] The plugin has zero runtime dependencies
- [ ] The npm package publishes successfully

## Testing
```bash
# Install and verify
dev api enable namecheap
dev api list
dev schema api.namecheap

# Test domain operations (requires namecheap auth)
dev auth login namecheap
dev api namecheap domains list --format json
dev api namecheap domains get example.com --format json
dev api namecheap domains check newdomain.com --format json

# Test DNS operations
dev api namecheap dns list example.com --format json

# Test SSL operations
dev api namecheap ssl list --format json
```

## Notes
- The XML parser in `_helpers.js` is intentionally minimal. It handles the specific response shapes that Namecheap returns, not arbitrary XML. If Namecheap changes their response format significantly, the parser may need updates. A full XML parser library (like `fast-xml-parser`) could replace it, but it adds a dependency.
- The Namecheap API requires the client's IP address for every request (`ClientIp` parameter). This is used for IP whitelisting. The user must whitelist their IP in the Namecheap dashboard and configure it in the auth settings. If the IP doesn't match, all API calls will fail with an authorization error.
- The `dns set` command replaces ALL DNS records, not just the ones you pass. This is dangerous. Always include all existing records plus any new ones. The `dns delete` command handles this by fetching current records first, removing the target, and re-setting the rest. Document this clearly.
- Domain names must be split into SLD and TLD for many Namecheap API calls. Write a helper function for this. Be aware of multi-part TLDs like `.co.uk`, `.com.au`, `.org.uk`. A simple split on the first dot won't work for these.
- The Namecheap sandbox environment is available at `https://api.sandbox.namecheap.com/xml.response`. Consider adding a `--sandbox` flag or environment variable for testing without affecting real domains.
