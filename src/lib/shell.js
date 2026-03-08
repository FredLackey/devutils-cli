/**
 * Shell command execution.
 *
 * Wraps child_process.exec and child_process.execSync with consistent
 * error handling. Provides which() and commandExists(). Every installer
 * and utility that needs to run a shell command uses this instead of
 * calling child_process directly.
 */

// TODO: Implement shell execution wrappers
