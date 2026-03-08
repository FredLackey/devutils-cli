# API Wrapper Architecture

How external API integrations fit into the DevUtils CLI command structure. The goal is to provide simplified, opinionated wrappers around common services that are easy for both humans and AI agents to call, without dealing with pagination, token management, or the full complexity of native APIs.

**Note:** API wrappers ship as standalone plugins, not bundled in the core CLI.
See `proposed-api-plugin-architecture.md` for how plugins are packaged, installed,
and discovered at runtime. This document covers the design of the wrappers themselves.

---

## Design Principles

1. **Simplified, not comprehensive.** These wrappers cover what the average developer actually uses, not every endpoint the native API exposes. If someone needs the full API surface, they should use the native CLI or SDK.

2. **AI-first output.** Every command returns complete, usable results as structured JSON. No pagination tokens, no partial responses. The wrapper handles paging internally and returns the full result set (within configurable limits).

3. **Centralized auth.** OAuth registration, token storage, and refresh are managed in one place. Adding a new service connection is a single auth flow, and every API command for that service uses it automatically.

4. **Additive over time.** The API layer is designed to grow. Each service is a self-contained module. Adding a new service doesn't touch existing ones.

5. **Same global flags.** API commands use the same `--format`, `--json`, `--dry-run`, `--verbose`, `--quiet` flags as every other `dev` command.

---

## Where APIs Fit in the Command Hierarchy

API wrappers live under a dedicated `api` service, separate from the built-in services (config, machine, tools, etc.). This keeps the namespace clean and makes it obvious when a command is talking to an external service vs. managing local state.

Auth management lives under a dedicated `auth` service at the same level as `config`, `machine`, etc.

```
dev
│
├── config                            # (existing)
├── machine                           # (existing)
├── identity                          # (existing)
├── tools                             # (existing)
├── ignore                            # (existing)
├── util                              # (existing)
├── alias                             # (existing)
│
├── auth                              # OAuth and credential management
│   ├── login                         #   Authenticate with a service (opens browser for OAuth)
│   ├── logout                        #   Revoke credentials for a service
│   ├── list                          #   List connected services and token status
│   ├── status                        #   Show detailed auth state for one service
│   └── refresh                       #   Force token refresh for a service
│
├── api                               # External API wrappers
│   ├── list                          #   List available API services
│   │
│   ├── gmail                         # Google Gmail
│   │   ├── messages
│   │   │   ├── list
│   │   │   ├── get
│   │   │   ├── send
│   │   │   ├── search
│   │   │   ├── trash
│   │   │   └── delete
│   │   ├── labels
│   │   │   ├── list
│   │   │   └── get
│   │   ├── drafts
│   │   │   ├── list
│   │   │   ├── create
│   │   │   ├── update
│   │   │   └── send
│   │   └── threads
│   │       ├── list
│   │       ├── get
│   │       └── trash
│   │
│   ├── drive                         # Google Drive
│   │   ├── files
│   │   │   ├── list
│   │   │   ├── get
│   │   │   ├── upload
│   │   │   ├── download
│   │   │   ├── search
│   │   │   ├── move
│   │   │   └── delete
│   │   ├── folders
│   │   │   ├── list
│   │   │   ├── create
│   │   │   └── delete
│   │   └── permissions
│   │       ├── list
│   │       ├── add
│   │       └── remove
│   │
│   ├── sheets                        # Google Sheets
│   │   ├── spreadsheets
│   │   │   ├── list
│   │   │   ├── get
│   │   │   └── create
│   │   ├── values
│   │   │   ├── get
│   │   │   ├── set
│   │   │   ├── append
│   │   │   └── clear
│   │   └── sheets
│   │       ├── list
│   │       ├── add
│   │       └── remove
│   │
│   ├── docs                          # Google Docs
│   │   └── documents
│   │       ├── list
│   │       ├── get
│   │       ├── create
│   │       └── export
│   │
│   ├── aws                           # Amazon Web Services (opinionated subset)
│   │   ├── compute
│   │   │   ├── list                  #   List EC2 instances (simplified view)
│   │   │   ├── get                   #   Get instance details
│   │   │   ├── start
│   │   │   ├── stop
│   │   │   └── status
│   │   ├── storage
│   │   │   ├── buckets
│   │   │   │   └── list
│   │   │   └── objects
│   │   │       ├── list
│   │   │       ├── upload
│   │   │       └── download
│   │   ├── functions
│   │   │   ├── list
│   │   │   ├── invoke
│   │   │   └── logs
│   │   └── groups                    #   Operate on tagged groups of resources
│   │       ├── list
│   │       ├── status
│   │       ├── start
│   │       └── stop
│   │
│   ├── cloudflare                    # Cloudflare (DNS, zones, tunnels)
│   │   ├── zones
│   │   │   ├── list
│   │   │   ├── get
│   │   │   └── create
│   │   ├── dns
│   │   │   ├── list
│   │   │   ├── get
│   │   │   ├── create
│   │   │   ├── update
│   │   │   └── delete
│   │   └── tokens
│   │       ├── list
│   │       └── verify
│   │
│   ├── dokploy                       # Dokploy (application deployment)
│   │   ├── applications
│   │   │   ├── list
│   │   │   ├── get
│   │   │   ├── create
│   │   │   ├── start
│   │   │   ├── stop
│   │   │   └── delete
│   │   ├── projects
│   │   │   ├── list
│   │   │   ├── get
│   │   │   └── create
│   │   ├── domains
│   │   │   ├── list
│   │   │   ├── add
│   │   │   └── remove
│   │   └── servers
│   │       ├── list
│   │       └── get
│   │
│   ├── namecheap                     # Namecheap (domain registration and DNS)
│   │   ├── domains
│   │   │   ├── list
│   │   │   ├── get
│   │   │   └── check
│   │   ├── dns
│   │   │   ├── list
│   │   │   ├── set
│   │   │   └── delete
│   │   └── ssl
│   │       ├── list
│   │       └── get
│   │
│   ├── flowroute                     # Flowroute (SMS, MMS, messaging)
│   │   ├── sms
│   │   │   ├── send
│   │   │   └── list
│   │   ├── mms
│   │   │   ├── send
│   │   │   └── list
│   │   └── numbers
│   │       ├── list
│   │       └── get
│   │
│   └── mailu                         # Mailu (email server administration)
│       ├── users
│       │   ├── list
│       │   ├── get
│       │   ├── create
│       │   └── delete
│       ├── aliases
│       │   ├── list
│       │   ├── create
│       │   └── delete
│       └── domains
│           ├── list
│           └── add
│
├── status                            # (existing)
├── update                            # (existing)
├── version                           # (existing)
├── schema                            # (existing)
└── help                              # (existing)
```

---

## Auth Flow

### How a user connects a service

```
dev auth login gmail
```

1. CLI checks if OAuth client credentials exist for the service in `~/.devutils/auth/`
2. If no client credentials, prompts user to provide them (or uses built-in defaults for supported services)
3. Opens browser for OAuth consent
4. Receives callback, stores access token and refresh token in `~/.devutils/auth/<service>.json`
5. Subsequent API calls use stored tokens automatically

### Token lifecycle

- Tokens are stored per-service in `~/.devutils/auth/`
- Access tokens auto-refresh when expired (using refresh token)
- `dev auth list` shows all connected services and whether tokens are valid
- `dev auth logout gmail` revokes and removes tokens for a service
- `dev auth status gmail` shows detailed token info (scopes, expiry, account)

### Credential storage

```
~/.devutils/
├── config.json
├── machines/
└── auth/
    ├── gmail.json                    # OAuth tokens for Gmail
    ├── drive.json                    # OAuth tokens for Drive (may share with Gmail)
    ├── sheets.json
    ├── aws.json                      # AWS credentials (access key, secret, region)
    └── clients/
        ├── google.json               # Google OAuth client ID/secret (shared across Google services)
        └── aws.json                  # AWS credential config
```

Google services can share a single OAuth client and token set with different scopes. AWS uses its own credential model (access key / secret / region / profile).

---

## How API Wrappers Differ from Native CLIs

### Pagination is handled internally

Native APIs return paginated responses with tokens. The wrappers fetch all pages internally and return the combined result. A configurable `--limit` flag caps the total items returned.

The caller never sees pagination tokens. They get a flat array.

### Responses are simplified

Native API responses include metadata, nested wrappers, and fields most callers don't need. The wrappers return a cleaned-up structure with the fields developers actually use.

### Errors are consistent

All API errors map to the same structured JSON error format used by every other `dev` command:

```
{
  "error": {
    "code": <number>,
    "message": <string>,
    "service": <string>
  }
}
```

Errors go to stderr. Exit code 1.

### Auth is invisible

The caller doesn't pass tokens or manage sessions. If auth is valid, the command runs. If auth is expired, the wrapper refreshes automatically. If auth is missing, the command fails with a clear error pointing to `dev auth login <service>`.

---

## How New APIs Get Added

Each API service is a self-contained module under `src/api/<service>/`. Adding a new service requires:

1. **Service directory**: `src/api/<service>/`
2. **Resource files**: One file per resource (e.g., `messages.js`, `files.js`)
3. **Auth adapter**: How to authenticate (OAuth, API key, etc.)
4. **Schema definition**: What commands exist, what input they accept, what output they return (for `dev schema` introspection)

No changes to the core CLI are needed. The API service registry discovers available services from the `src/api/` directory.

### Future candidates

Services that would fit this pattern as the tool grows:

| Service | Why |
|---|---|
| GitHub | PR management, issue tracking, repo operations |
| Slack | Channel messages, user lookup, notifications |
| DigitalOcean | Droplet management, simplified compute |
| Vercel | Deployment management |
| Linear | Issue tracking |
| Notion | Page and database operations |
| Calendar | Google Calendar event management |

Each would follow the same `dev api <service> <resource> <method>` pattern.

---

## AI Agent Considerations

The API wrappers are designed to be called by AI agents (Claude, Gemini, OpenClaw, etc.) running locally. Key design choices that support this:

1. **JSON in, JSON out.** Every command accepts `--json` for structured input and returns structured JSON by default. No interactive prompts during execution.

2. **Complete responses.** No pagination tokens to chase. No partial results requiring follow-up calls. The agent gets everything it needs in one call.

3. **Predictable structure.** `dev schema api.gmail.messages.list` returns the exact input/output shape. An agent can introspect any command before calling it.

4. **Idempotent reads.** All `list`, `get`, `search`, and `status` commands are safe to call repeatedly. Write operations (`send`, `create`, `delete`) are clearly named.

5. **Composable.** Output from one command can feed into another via `jq` or shell variables. The consistent JSON structure makes this reliable.

6. **MCP compatibility.** The `dev api` surface maps directly to MCP tool definitions. A future `dev mcp` command could expose all API wrappers as MCP tools, similar to how `gws mcp` works.
