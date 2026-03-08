# Story 003: Publish to npm

## Goal

Prepare the package for publication, publish it to npm as `@fredlackey/devutils`, and verify that a clean global install works on a fresh machine. This is the final story. After this, v1.0 is live and usable.

## Prerequisites

- 018-release/002 (README and docs — everything is documented before publishing)

## Background

The package is already configured in `package.json` with the scoped name `@fredlackey/devutils`, `publishConfig.access: "public"`, and the `bin` field pointing to `src/cli.js`. The `files` field restricts the published content to `src/`. What remains is a pre-publish checklist, the actual publish command, and post-publish verification.

Publishing to npm is a one-way action for each version number. You can unpublish within 72 hours, but it's messy. So we verify everything before running `npm publish`.

## Technique

### Step 1: Pre-publish checklist

Go through each item and verify:

1. **Version number** — Open `package.json` and confirm the `version` field is set to `1.0.0` (or whatever version you're publishing). Don't publish as `0.0.19` if this is the production release.

2. **Package name** — Confirm `name` is `@fredlackey/devutils`.

3. **Bin field** — Confirm `bin.dev` points to `./src/cli.js`.

4. **Files field** — Confirm `files` is `["src/"]`. This means only the `src/` directory will be included in the published package.

5. **Dependencies** — Run `npm ls` to check for missing or extraneous dependencies. The only dependency should be `commander` (and any others added during implementation). No dev dependencies should be listed under `dependencies`.

6. **Shebang** — Open `src/cli.js` and confirm the first line is `#!/usr/bin/env node`.

7. **No secrets** — Grep the src/ directory for anything that looks like a hardcoded token, password, or API key. There should be zero results.

### Step 2: Test the package locally

```bash
# Pack the package (creates a .tgz file without publishing)
npm pack

# Inspect the contents
tar tzf fredlackey-devutils-1.0.0.tgz

# Verify:
# - Only package.json, README.md, LICENSE, and src/ files are included
# - No research/, stories/, test/, _rebuild/, .vscode/, or .claude/ files
```

### Step 3: Test a local install

```bash
# Install the packed tarball globally
npm install -g ./fredlackey-devutils-1.0.0.tgz

# Verify the binary works
dev version
# Should output: 1.0.0

dev help
# Should list all services

dev status
# Should run without errors (may show "not configured" which is fine)

# Clean up
npm uninstall -g @fredlackey/devutils
```

### Step 4: Verify npm login

```bash
# Check that you're logged in to npm as the right user
npm whoami
# Should output: fredlackey (or whatever the npm username is)

# If not logged in:
npm login
```

### Step 5: Publish

```bash
npm publish --access public
```

This publishes the package to the npm registry. The `--access public` flag is required for scoped packages on the first publish (it's also in `publishConfig` but being explicit doesn't hurt).

### Step 6: Post-publish verification

```bash
# Wait a minute for npm to propagate

# Install from npm on a clean machine (or in a temp directory)
npm install -g @fredlackey/devutils

# Verify
dev version
dev help
dev config init   # Walk through onboarding
dev machine detect
dev status
```

### Step 7: Create a release checklist file

Create `RELEASING.md` at the project root documenting the steps for future releases:

```markdown
# Release Checklist

1. Update version in package.json
2. Run tests: `npm test`
3. Pack and inspect: `npm pack && tar tzf *.tgz`
4. Test local install: `npm install -g ./fredlackey-devutils-*.tgz`
5. Verify: `dev version && dev help && dev status`
6. Commit version bump
7. Tag: `git tag v<version>`
8. Push: `git push && git push --tags`
9. Publish: `npm publish --access public`
10. Verify from npm: `npm install -g @fredlackey/devutils && dev version`
```

## Files to Create or Modify

- `package.json` — Update version to 1.0.0 (if not already)
- `RELEASING.md` — Release checklist for future versions (new file)

## Acceptance Criteria

- [ ] `npm pack` produces a tarball containing only src/, package.json, README.md, and LICENSE
- [ ] No secrets or hardcoded credentials in the published files
- [ ] Local install from tarball works: `dev version` outputs the correct version
- [ ] `dev help` lists all services after a fresh install
- [ ] Package is published to npm and visible at npmjs.com/package/@fredlackey/devutils
- [ ] `npm install -g @fredlackey/devutils` works on a clean machine
- [ ] `dev config init` completes the onboarding flow after a fresh install
- [ ] RELEASING.md documents the full release process for future versions

## Testing

```bash
# Pre-publish tests
npm test                    # All integration tests pass
npm pack --dry-run          # Shows what would be included
npm pack                    # Creates the tarball
tar tzf *.tgz | head -20   # Inspect contents

# Local install test
npm install -g ./fredlackey-devutils-1.0.0.tgz
dev version                 # Should output 1.0.0
dev help                    # Should list all services
dev machine detect          # Should detect the current machine
npm uninstall -g @fredlackey/devutils

# Post-publish test (after npm publish)
npm install -g @fredlackey/devutils
dev version
dev config init
```

## Notes

- **Version number**: If you're not ready to call it 1.0.0, that's fine. Use whatever version makes sense. The important thing is that the version in package.json matches what you intend to publish.
- **npm unpublish**: You can unpublish a version within 72 hours, but it's discouraged. Get it right before publishing.
- **Scoped packages**: The `@fredlackey/` scope requires the `--access public` flag on first publish. After that, subsequent publishes default to whatever access was set initially.
- **Git tags**: Tag the release commit with `v1.0.0` (or whatever version). This creates a reference point in git history for each published version.
- **CI publishing**: In the future, consider setting up GitHub Actions to publish automatically on tagged commits. But for v1.0, a manual publish is fine and gives you a chance to inspect everything.
- **The .tgz inspection step is not optional.** Always look at what's in the tarball before publishing. It's the only way to be sure you're not shipping research docs, test files, or other non-package content.
