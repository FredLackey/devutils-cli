# Story 001: Create the API Plugin Template

## Goal
Create a reusable template directory at `research/plugin-template/` that serves as the starting point for every API plugin package. This is not an npm package itself -- it's a set of starter files you copy when building a new plugin. It includes a `package.json` template, an `index.js` with the plugin contract structure, a `commands/` directory with a sample resource and command file, and a `README.md` explaining how to set up and test the plugin. Every plugin story after this one references this template as its starting point.

## Prerequisites
- 012-api-system/001 (API plugin system in the core CLI)

## Background
API plugins are standalone npm packages that follow a specific contract defined in `research/proposed/proposed-api-plugin-architecture.md`. Each plugin exports `{ name, description, version, auth, resources }`. Resources contain lazy-loaded command files that export `{ meta, run }`.

The template needs to be generic enough to copy and customize for any service, but concrete enough that a developer can fill in the blanks without guessing. Placeholder values are marked with `<angle brackets>` so you can find-and-replace them.

Plugins live in their own git repos (e.g., `git@github.com:FredLackey/devutils-api-gmail.git`) and are published to npm as scoped packages (e.g., `@fredlackey/devutils-api-gmail`). They are installed into `~/.devutils/plugins/` by the core CLI's `dev api enable` command.

## Technique

1. Create the directory structure:
   ```
   research/plugin-template/
   ├── package.json
   ├── index.js
   ├── README.md
   └── commands/
       └── sample/
           └── list.js
   ```

2. **`package.json`** -- Create a template with placeholders:
   ```json
   {
     "name": "@fredlackey/devutils-api-<service>",
     "version": "1.0.0",
     "description": "<Service display name> plugin for DevUtils CLI",
     "main": "index.js",
     "files": [
       "index.js",
       "commands/"
     ],
     "repository": {
       "type": "git",
       "url": "git+ssh://git@github.com/FredLackey/devutils-api-<service>.git"
     },
     "author": {
       "name": "Fred Lackey",
       "email": "fred.lackey@gmail.com",
       "url": "https://fredlackey.com"
     },
     "license": "Apache-2.0",
     "publishConfig": {
       "access": "public"
     },
     "keywords": [
       "devutils",
       "devutils-plugin",
       "<service>"
     ],
     "peerDependencies": {
       "@fredlackey/devutils": ">=0.1.0"
     }
   }
   ```
   Key points:
   - `name` uses the `@fredlackey/devutils-api-<service>` convention.
   - `files` includes only `index.js` and `commands/` so the npm package stays lean.
   - `peerDependencies` declares a dependency on the core CLI without bundling it.
   - No `dependencies` block by default. Add service-specific SDKs as needed (e.g., `googleapis` for Google services, `@aws-sdk/client-ec2` for AWS).
   - The repository URL uses SSH, matching the project convention.

3. **`index.js`** -- Create the plugin contract template:
   ```javascript
   /**
    * <Service display name> plugin for DevUtils CLI.
    *
    * Exports the plugin contract: { name, description, version, auth, resources }.
    * Resources use lazy-loaded command files following the { meta, run } pattern.
    */

   module.exports = {

     // Service identity -- the short name used in "dev api <name> ..."
     name: '<service>',

     // Human-readable description shown in "dev api list"
     description: '<Service display name> (<resource1>, <resource2>, ...)',

     // Plugin version (follows semver, independent of the core CLI version)
     version: '1.0.0',

     // Auth service this plugin requires (maps to "dev auth login <auth>")
     auth: '<auth-service>',

     // Resources and their commands
     resources: {
       sample: {
         description: 'Sample resource (replace with real resource)',
         commands: {
           list: () => require('./commands/sample/list'),
           // Add more commands here:
           // get:    () => require('./commands/sample/get'),
           // create: () => require('./commands/sample/create'),
         }
       }
       // Add more resources here:
       // another: {
       //   description: 'Another resource',
       //   commands: {
       //     list: () => require('./commands/another/list'),
       //   }
       // }
     }
   };
   ```

4. **`commands/sample/list.js`** -- Create a sample command file:
   ```javascript
   /**
    * List sample resources.
    *
    * This is a template command file. Replace the implementation with real
    * API calls for your service. The structure stays the same: export
    * { meta, run } where meta describes the interface and run does the work.
    */

   const meta = {
     description: 'List sample resources',
     arguments: [],
     flags: [
       {
         name: 'limit',
         type: 'number',
         description: 'Maximum number of results to return'
       }
     ]
   };

   /**
    * @param {object} args - Parsed command arguments and flags
    * @param {object} context - Provided by the core CLI
    * @param {object} context.auth - Authenticated client for this plugin's auth service
    * @param {object} context.output - Output formatting (render, format detection)
    * @param {object} context.errors - Structured error creation (throw, wrap)
    * @param {object} context.config - Read-only user config access
    * @param {object} context.shell - Shell execution (exec, which, commandExists)
    * @param {object} context.platform - OS, architecture, package manager info
    */
   async function run(args, context) {
     // 1. Build the API request using context.auth for credentials.
     //    Example for Google APIs:
     //      const response = await context.auth.request({
     //        url: 'https://api.example.com/v1/resources',
     //        params: { maxResults: args.limit || 10 }
     //      });
     //
     // 2. Parse the response and extract the data you need.
     //    const items = response.data.items || [];
     //
     // 3. Pass the result to context.output for format-aware rendering.
     //    return context.output.render({ items });
     //
     // 4. For errors, use context.errors:
     //    if (!response.ok) {
     //      return context.errors.throw(response.status, response.statusText);
     //    }

     return context.errors.throw(501, 'Not implemented. Replace this with real API logic.');
   }

   module.exports = { meta, run };
   ```

5. **`README.md`** -- Create a template README:
   ```markdown
   # @fredlackey/devutils-api-<service>

   <Service display name> plugin for [DevUtils CLI](https://github.com/FredLackey/devutils-cli).

   ## Installation

   Install through the DevUtils CLI:

       dev api enable <service>

   Or install directly from npm:

       npm install @fredlackey/devutils-api-<service>

   ## Authentication

   This plugin requires authentication with <auth-service>:

       dev auth login <auth-service>

   ## Commands

   | Command | Description |
   |---------|-------------|
   | `dev api <service> sample list` | List sample resources |

   ## Development

   ### Setup

   1. Clone the repo:

          git clone git@github.com:FredLackey/devutils-api-<service>.git
          cd devutils-api-<service>

   2. Install dependencies (if any):

          npm install

   3. Link for local testing:

          cd ~/.devutils/plugins
          npm install /path/to/devutils-api-<service>

   4. Verify the plugin loads:

          dev api list
          dev schema api.<service>

   ### Adding a command

   1. Create a new file under `commands/<resource>/<method>.js`.
   2. Export `{ meta, run }` following the pattern in `commands/sample/list.js`.
   3. Register it in `index.js` under the appropriate resource's `commands` map.
   4. Test it: `dev api <service> <resource> <method>`.

   ### Testing

   There is no test framework dependency. Test by running commands directly:

       dev api <service> sample list --format json
       dev schema api.<service>.sample.list

   ## License

   Apache-2.0
   ```

## Files to Create or Modify
- `research/plugin-template/package.json` -- New file. Template package.json with placeholders.
- `research/plugin-template/index.js` -- New file. Template plugin contract.
- `research/plugin-template/commands/sample/list.js` -- New file. Sample command file.
- `research/plugin-template/README.md` -- New file. Template README.

## Acceptance Criteria
- [ ] `research/plugin-template/` directory exists with all four files
- [ ] `package.json` uses the `@fredlackey/devutils-api-<service>` naming convention
- [ ] `package.json` uses SSH for the repository URL
- [ ] `index.js` exports the full plugin contract shape: `{ name, description, version, auth, resources }`
- [ ] Resources in `index.js` use lazy-loading: `() => require('./commands/...')`
- [ ] `commands/sample/list.js` exports `{ meta, run }` with a complete `meta` object
- [ ] The sample command's `run` function documents all `context` properties with JSDoc comments
- [ ] `README.md` includes installation, authentication, commands, and development sections
- [ ] All placeholder values use `<angle brackets>` for easy find-and-replace
- [ ] No actual API calls are made -- this is a template, not a working plugin

## Testing
The template itself doesn't run. Testing is manual verification:
```bash
# Verify the directory structure
ls -R research/plugin-template/
# Expected:
# research/plugin-template/:
# README.md  commands  index.js  package.json
#
# research/plugin-template/commands:
# sample
#
# research/plugin-template/commands/sample:
# list.js

# Verify the plugin contract shape
node -e "const p = require('./research/plugin-template/index.js'); console.log(Object.keys(p));"
# Expected: [ 'name', 'description', 'version', 'auth', 'resources' ]

# Verify the command shape
node -e "const c = require('./research/plugin-template/commands/sample/list.js'); console.log(Object.keys(c));"
# Expected: [ 'meta', 'run' ]
```

## Notes
- This template lives in `research/` because it's not part of the CLI package. It won't be published to npm or included in the `src/` tree. It's a reference for developers building plugins.
- When creating a new plugin, the workflow is: (1) copy `research/plugin-template/` to a new directory, (2) find-and-replace all `<service>` placeholders, (3) rename the `sample` resource to the first real resource, (4) implement the command files, (5) publish to npm.
- The `peerDependencies` field declares that the plugin expects the core CLI to be installed but doesn't bundle it. This is important because the plugin receives `context` from the core CLI at runtime -- it doesn't import CLI modules directly.
- If a plugin needs an SDK (like `googleapis` or `@aws-sdk/client-ec2`), add it to `dependencies` in the plugin's `package.json`. Keep the template's `dependencies` empty since different services need different things.
- The `files` field in `package.json` is critical. It ensures only `index.js` and `commands/` are published to npm. Without it, you'd accidentally ship test files, docs, and other development artifacts.
