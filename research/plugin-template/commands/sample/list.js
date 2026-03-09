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
 * @param {object} context.output - Output formatting (out, info, error, render)
 * @param {object} context.errors - Structured error creation (throwError)
 * @param {object} context.config - Read-only user config access
 * @param {object} context.shell - Shell execution (exec, which, commandExists)
 * @param {object} context.platform - OS, architecture, package manager info
 */
async function run(args, context) {
  // 1. Build the API request using context.auth for credentials.
  //    Example for Google APIs:
  //      const response = await context.auth.request({
  //        url: 'https://api.example.com/v1/resources',
  //        params: { maxResults: args.flags.limit || 10 }
  //      });
  //
  // 2. Parse the response and extract the data you need.
  //    const items = response.data.items || [];
  //
  // 3. Pass the result to context.output for format-aware rendering.
  //    context.output.out(items);
  //
  // 4. For errors, use context.errors:
  //    if (!response.ok) {
  //      context.errors.throwError(response.status, response.statusText, '<service>');
  //    }

  context.errors.throwError(501, 'Not implemented. Replace this with real API logic.', '<service>');
}

module.exports = { meta, run };
