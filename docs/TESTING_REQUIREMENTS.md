# Testing Requirements for Installers

This document describes the testing requirements and result tracking for installer scripts in `src/installs/`.

## Overview

Each technology in `src/installs/installers.json` must be tested across all applicable environments before being marked as production-ready. Test results are tracked directly in the JSON file to provide visibility into what has been tested and the outcome.

## Test Environments

The following Docker-based test environments are available:

| Environment | Base Image | Desktop Available |
|-------------|------------|-------------------|
| `ubuntu` | Ubuntu 22.04 | No (headless) |
| `ubuntu-desktop` | Ubuntu 22.04 | Yes (Xvfb + GNOME) |
| `debian` | Debian 12 | No (headless) |
| `amazonlinux` | Amazon Linux 2023 | No (headless) |
| `fedora` | Fedora 39 | No (headless) |

**Important:** Most Docker test environments are headless (no desktop environment). This means:
- Desktop applications (`"desktop": true`) will return `"not_eligible"` from `isEligible()` in headless environments
- Use `ubuntu-desktop` to test desktop applications in Docker with a virtual display (Xvfb)
- The `ubuntu-desktop` environment includes `ubuntu-desktop-minimal` (GNOME) and runs Xvfb at 1920x1080x24
- Some desktop applications may still require manual testing on systems with real GUI support

## Test Result Structure

Each technology in `installers.json` includes a `test_results` array containing result objects:

```json
{
  "filename": "node.js",
  "name": "Node.js",
  "status": "ready",
  "environments": ["macos", "ubuntu", "debian", "wsl", "raspbian", "amazon_linux", "fedora", "rhel", "windows", "gitbash"],
  "depends_on": [...],
  "test_results": [
    { "environment": "ubuntu", "result": "pass" },
    { "environment": "debian", "result": "pass" },
    { "environment": "amazonlinux", "result": "pass" },
    { "environment": "fedora", "result": "pass" }
  ]
}
```

### Result Values

| Result | Description |
|--------|-------------|
| `pass` | The `install()` function completed successfully. The technology was installed and verified. |
| `fail` | The `install()` function encountered an error during installation. Requires investigation and fixes. |
| `not_eligible` | The `isEligible()` function returned `false`. The installer correctly determined it cannot run in this environment (e.g., desktop app on headless system, wrong OS). |

### Result Interpretation

- **`pass`**: The installer works correctly in this environment.
- **`fail`**: There is a bug in the installer that needs to be fixed.
- **`not_eligible`**: This is a valid outcome when the installer correctly identifies incompatibility. For desktop applications in headless Docker environments, this is the expected result.

## Status Values

The `status` field indicates the overall testing state of the installer:

| Status | Description |
|--------|-------------|
| `test-pending` | The installer has not been tested or needs re-testing. |
| `ready` | The installer has been tested in all applicable environments with no failures. |

### Criteria for "ready" Status

An installer can be marked as `"ready"` when:

1. **All applicable Docker environments have been tested** (ubuntu, ubuntu-desktop, debian, amazonlinux, fedora)
2. **No `"fail"` results exist** in `test_results`
3. **Results are appropriate for the technology type:**
   - Non-desktop apps: Should have `"pass"` for supported environments
   - Desktop apps: Should have `"not_eligible"` for headless environments and `"pass"` for `ubuntu-desktop`

## Testing Process

### Running Tests

```bash
# Test a specific installer in a specific environment
docker compose -f testing/docker-compose.yml run --rm ubuntu node -e "
  const installer = require('./src/installs/node.js');
  (async () => {
    console.log('isEligible:', installer.isEligible());
    if (installer.isEligible()) {
      await installer.install();
      const installed = await installer.isInstalled();
      console.log('isInstalled:', installed);
    }
  })();
"

# Interactive shell for debugging
./testing/test.sh --shell ubuntu
```

### Recording Results

After testing, update `installers.json` with the results:

```json
"test_results": [
  { "environment": "ubuntu", "result": "pass" },
  { "environment": "ubuntu-desktop", "result": "pass" },
  { "environment": "debian", "result": "pass" },
  { "environment": "amazonlinux", "result": "pass" },
  { "environment": "fedora", "result": "pass" }
]
```

### Desktop Application Testing

Desktop applications require special consideration:

1. **In Docker (headless):** Expect `"not_eligible"` results - this confirms `isEligible()` correctly detects the lack of desktop environment.

2. **In Docker (ubuntu-desktop):** The `ubuntu-desktop` environment provides a virtual display (Xvfb) with a full GNOME desktop. Desktop applications should:
   - Return `true` from `isEligible()`
   - Complete `install()` successfully
   - Return `true` from `isInstalled()` after installation

3. **On real desktop systems:** Some applications may still require manual testing to verify:
   - The application launches correctly with a real display
   - GUI functionality works as expected

For desktop apps, test results should include `ubuntu-desktop`:

```json
"test_results": [
  { "environment": "ubuntu", "result": "not_eligible" },
  { "environment": "ubuntu-desktop", "result": "pass" },
  { "environment": "debian", "result": "not_eligible" },
  { "environment": "amazonlinux", "result": "not_eligible" },
  { "environment": "fedora", "result": "not_eligible" }
]
```

## Example Entries

### Non-Desktop Application (e.g., Node.js)

```json
{
  "filename": "node.js",
  "name": "Node.js",
  "status": "ready",
  "environments": ["macos", "ubuntu", "debian", "wsl", "raspbian", "amazon_linux", "fedora", "rhel", "windows", "gitbash"],
  "depends_on": [...],
  "test_results": [
    { "environment": "ubuntu", "result": "pass" },
    { "environment": "ubuntu-desktop", "result": "pass" },
    { "environment": "debian", "result": "pass" },
    { "environment": "amazonlinux", "result": "pass" },
    { "environment": "fedora", "result": "pass" }
  ]
}
```

### Desktop Application (e.g., VS Code)

```json
{
  "filename": "vscode.js",
  "name": "Visual Studio Code",
  "status": "ready",
  "environments": ["macos", "ubuntu", "debian", "wsl", "raspbian", "amazon_linux", "fedora", "rhel", "windows", "gitbash"],
  "desktop": true,
  "depends_on": [...],
  "test_results": [
    { "environment": "ubuntu", "result": "not_eligible" },
    { "environment": "ubuntu-desktop", "result": "pass" },
    { "environment": "debian", "result": "not_eligible" },
    { "environment": "amazonlinux", "result": "not_eligible" },
    { "environment": "fedora", "result": "not_eligible" }
  ]
}
```

## Notes

- The `test_results` array only tracks Docker-based automated testing
- macOS, Windows, WSL, Raspberry Pi OS, and Git Bash require manual testing on real systems
- Desktop applications (`"desktop": true`) will be `"not_eligible"` in headless Docker environments (ubuntu, debian, amazonlinux, fedora)
- Desktop applications should be tested in `ubuntu-desktop` which provides Xvfb virtual display with GNOME
- A `"not_eligible"` result for a desktop app in a headless environment is considered a PASS for testing purposes (the `isEligible()` check is working correctly)
- A `"pass"` result for a desktop app in `ubuntu-desktop` confirms the installer works with a display environment
