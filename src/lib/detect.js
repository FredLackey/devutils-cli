/**
 * Output mode detection.
 *
 * Determines the default output format by checking three layers in order:
 * 1. AI tool environment variables (CLAUDECODE, GEMINI_CLI, etc.)
 * 2. CI/CD environment variables (CI, BUILD_NUMBER, TF_BUILD)
 * 3. TTY detection via process.stdout.isTTY
 *
 * Returns { format, caller } where:
 * - format: 'json' | 'table' (resolved default, overridden by --format flag)
 * - caller: 'ai' | 'ci' | 'tty' | 'pipe' (detected context)
 */

// TODO: Implement detection logic
