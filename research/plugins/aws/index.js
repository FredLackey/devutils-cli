/**
 * AWS plugin for DevUtils CLI.
 *
 * Exports the plugin contract: { name, description, version, auth, resources }.
 * Resources use lazy-loaded command files following the { meta, run } pattern.
 */

module.exports = {

  // Service identity -- the short name used in "dev api aws ..."
  name: 'aws',

  // Human-readable description shown in "dev api list"
  description: 'AWS (EC2, S3, Lambda)',

  // Plugin version (follows semver, independent of the core CLI version)
  version: '1.0.0',

  // Auth service this plugin requires (maps to "dev auth login aws")
  auth: 'aws',

  // Resources and their commands
  resources: {
    ec2: {
      description: 'EC2 virtual machine instances',
      commands: {
        list:  () => require('./commands/ec2/list'),
        start: () => require('./commands/ec2/start'),
        stop:  () => require('./commands/ec2/stop')
      }
    },
    s3: {
      description: 'S3 object storage buckets and objects',
      commands: {
        list: () => require('./commands/s3/list'),
        get:  () => require('./commands/s3/get'),
        put:  () => require('./commands/s3/put')
      }
    },
    lambda: {
      description: 'Lambda serverless functions',
      commands: {
        list:   () => require('./commands/lambda/list'),
        get:    () => require('./commands/lambda/get'),
        invoke: () => require('./commands/lambda/invoke')
      }
    }
  }
};
