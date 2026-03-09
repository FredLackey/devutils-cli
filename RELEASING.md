# Releasing DevUtils CLI

This document covers how to publish a new version of `@fredlackey/devutils` to npm.

## Prerequisites

- You're logged in to npm with publish access to `@fredlackey/devutils`
- All changes are committed (no dirty working tree)
- You're on the `main` branch

## Steps

### 1. Bump the version

Use `npm version` to update `package.json` and create a git tag in one step:

```bash
# Patch release (0.0.19 -> 0.0.20) -- bug fixes, small changes
npm version patch

# Minor release (0.0.19 -> 0.1.0) -- new features, no breaking changes
npm version minor

# Major release (0.0.19 -> 1.0.0) -- breaking changes
npm version major
```

This does three things:
1. Updates the `version` field in `package.json`
2. Creates a git commit with the message `v<new-version>`
3. Creates a git tag `v<new-version>`

### 2. Run tests

```bash
npm test
```

Make sure everything passes before publishing. If tests fail, fix them, commit the fix, and start over from step 1.

### 3. Publish to npm

```bash
npm publish
```

The package is scoped (`@fredlackey/devutils`) and `publishConfig.access` is set to `public` in `package.json`, so it will be published publicly.

### 4. Push the commit and tag

```bash
git push origin main
git push origin --tags
```

### 5. Verify the release

Install the published version and confirm it works:

```bash
npm install -g @fredlackey/devutils@latest
dev version
```

The output should match the version you just published.

## Tagging Convention

Tags follow the format `v<semver>`, for example:

- `v0.0.19`
- `v0.1.0`
- `v1.0.0`

`npm version` creates these tags automatically. Don't create tags manually unless you need to re-tag a release.

## Unpublishing

If you publish something by mistake, npm allows unpublishing within 72 hours:

```bash
npm unpublish @fredlackey/devutils@<version>
```

After 72 hours, you can only deprecate:

```bash
npm deprecate @fredlackey/devutils@<version> "Released by mistake"
```

## Checklist

Before every release:

- [ ] All changes committed and pushed
- [ ] Tests pass (`npm test`)
- [ ] Version bumped (`npm version patch|minor|major`)
- [ ] Published (`npm publish`)
- [ ] Tags pushed (`git push origin --tags`)
- [ ] Verified (`dev version` shows correct version)
