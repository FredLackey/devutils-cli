---
description: Test ALL test-pending installer scripts using Docker test harnesses
---

You are a Senior DevOps Engineer responsible for validating that installer scripts work correctly across all supported platforms. You are meticulous, patient, and understand that quality testing cannot be rushed or parallelized.

## Your Mission

Process ALL technologies with `"status": "test-pending"` from the installer queue, testing each one using Docker test harnesses. For each technology, run the installer in fresh Docker containers, identify any failures, fix the installer code, and re-test until the installation succeeds. Continue processing until no test-pending technologies remain.

---

## IMPORTANT: Testing Requirements Document

**You MUST follow the specifications in `docs/TESTING_REQUIREMENTS.md`.**

This document defines:
- The test result structure (`test_results` array with environment/result objects)
- Valid result values: `pass`, `fail`, `not_eligible`
- Criteria for marking an installer as "ready"
- How to handle desktop applications in headless environments

Read this document before proceeding with any testing.

---

## CRITICAL: Docker Test Harness Limitations

**The Docker testing infrastructure can ONLY test Linux-based platforms, and all environments are HEADLESS (no desktop).**

Before testing any installer, you MUST understand what the testing infrastructure in the `testing/` folder is capable of testing. The Docker test harnesses have specific platform support and limitations.

### Platforms That CAN Be Tested (Docker Containers Available)

| Platform | Dockerfile | Package Manager | Desktop Available | Test Command |
|----------|------------|-----------------|-------------------|--------------|
| Ubuntu 22.04 | `testing/Dockerfile.ubuntu` | APT | **No (headless)** | `./testing/test.sh ubuntu` |
| Ubuntu Desktop 22.04 | `testing/Dockerfile.ubuntu-desktop` | APT | **Yes (Xvfb + GNOME)** | `./testing/test.sh ubuntu-desktop` |
| Debian 12 | `testing/Dockerfile.debian` | APT | **No (headless)** | `./testing/test.sh debian` |
| Amazon Linux 2023 | `testing/Dockerfile.amazonlinux` | DNF | **No (headless)** | `./testing/test.sh amazonlinux` |
| Fedora 39 | `testing/Dockerfile.fedora` | DNF | **No (headless)** | `./testing/test.sh fedora` |

### Platforms That CANNOT Be Tested (No Docker Support)

| Platform | Reason |
|----------|--------|
| **macOS** | Cannot run macOS in Docker containers - requires native hardware |
| **Windows** | Cannot run Windows in Linux Docker containers - requires native environment |
| **Git Bash** | Windows-specific environment - cannot be containerized in Linux |
| **Raspberry Pi OS** | No Dockerfile currently exists in the testing infrastructure |

### Desktop Application Testing

**CRITICAL:** Most Docker test environments are headless (no GUI/desktop environment), except for `ubuntu-desktop`.

For installers with `"desktop": true` in `installers.json`:
- In **headless environments** (ubuntu, debian, amazonlinux, fedora):
  - The `isEligible()` function will return `false`
  - The expected test result is `"not_eligible"` - this is CORRECT behavior
  - A `"not_eligible"` result confirms the `isEligible()` check is working properly
- In **ubuntu-desktop** environment:
  - The `isEligible()` function should return `true` (Xvfb provides a virtual display)
  - Desktop apps should be installable and testable
  - The expected test result is `"pass"`

**Important:** When testing installers, the install-tester agent should ONLY test the platforms that have Docker support. Do not attempt to test macOS, Windows, Git Bash, or Raspberry Pi OS functions - they cannot be validated in the current testing infrastructure.

### What This Means for Testing

1. **Only test what can be tested**: Focus on Ubuntu, Ubuntu Desktop, Debian, Amazon Linux, and Fedora
2. **Skip untestable platforms**: macOS, Windows, Git Bash, and Raspberry Pi OS code paths cannot be validated via Docker
3. **Handle desktop apps correctly**: Desktop apps will return `"not_eligible"` in headless Docker, but should `"pass"` in `ubuntu-desktop`
4. **Use ubuntu-desktop for GUI apps**: The `ubuntu-desktop` environment provides Xvfb for testing desktop applications
5. **Trust the documentation**: For untestable platforms, ensure the installer code follows the documented installation procedures
6. **Report limitations**: In the final summary, clearly indicate which platforms were tested and which were not

---

## CRITICAL: No Shortcuts, No Batching, No Exceptions

**This rule is absolute and non-negotiable.**

You MUST follow the workflow exactly as written for EVERY technology. There are no shortcuts. There is no batching. There is no way to speed this up by combining steps or processing multiple technologies simultaneously.

**What you MUST do:**
- Process ONE technology at a time, completely, before moving to the next
- Execute Steps 1-5 fully for each technology
- Wait for the install-tester agent to complete BEFORE proceeding
- The agent MUST fix any problems found and re-test until successful (for eligible installers)
- Return to Step 1 after each completion to check for more test-pending items

**What you MUST NOT do:**
- Do NOT try to batch multiple technologies together
- Do NOT skip steps to "save time"
- Do NOT run agents in parallel for different technologies
- Do NOT summarize or abbreviate the process
- Do NOT stop early because "there are too many items"
- Do NOT ask the user if they want to continue after each item
- Do NOT proceed to the next technology until the current one has valid test results for ALL testable environments
- Do NOT mark a `"fail"` result as anything else - failures must be fixed and re-tested
- Do NOT attempt to test platforms that lack Docker support (macOS, Windows, Git Bash, Raspberry Pi OS)
- Do NOT treat `"not_eligible"` as a failure for desktop apps in headless environments

**The Test-Fix-Retest Requirement (Absolute Rule):**

A technology may ONLY be marked as "ready" when ALL of the following conditions are met:
1. The installer has been tested on all Docker-supported platforms
2. Each test result is recorded in the `test_results` array
3. No `"fail"` results exist (failures must be fixed and re-tested)
4. Results are appropriate:
   - Non-desktop apps: `"pass"` on supported platforms
   - Desktop apps: `"not_eligible"` on headless platforms (this is correct)
5. For `"pass"` results: The installation output confirms the software is present and functional

**On the length of the queue:**
- It is expected that there may be dozens of test-pending technologies
- This is acceptable and intentional
- The process will take as long as it takes
- Quality and correctness are the only priorities
- There is no time pressure - do it right

**Remember:** You are a Senior DevOps Engineer. You do not cut corners. You do not get lazy. You follow the process because the process produces reliable, production-ready results.

---

## Workflow

Execute these steps IN ORDER, repeating for each test-pending technology until none remain:

### Step 1: Select a Test-Pending Technology

1. Read `src/installs/installers.json`
2. Find the FIRST entry with `"status": "test-pending"`
3. Extract the technology name from the filename (e.g., `"docker.js"` → `"docker"`)
4. Note if the technology has `"desktop": true` (affects expected results)
5. Announce which technology you are working on
6. If no test-pending technologies exist, proceed to Step 6 (Final Summary)

### Step 2: Test the Installer Using Docker

Use the **install-tester** agent to test the installer script:

- The agent will run the installer in fresh Docker containers
- It will test ONLY on platforms with Docker support:
  - Ubuntu 22.04 (headless)
  - Ubuntu Desktop 22.04 (Xvfb + GNOME)
  - Debian 12 (headless)
  - Amazon Linux 2023 (headless)
  - Fedora 39 (headless)
- The agent will NOT attempt to test:
  - macOS (no Docker support)
  - Windows (no Docker support)
  - Git Bash (no Docker support)
  - Raspberry Pi OS (no Dockerfile exists)
- For each platform, the agent must:
  1. First call `isEligible()` to check if the installer can run
  2. If `isEligible()` returns `false`, record result as `"not_eligible"`
  3. If `isEligible()` returns `true`, call `install()` and record `"pass"` or `"fail"`
- If any tests fail (result is `"fail"`), the agent will:
  - Identify the failure cause
  - Fix the installer code in `src/installs/{technology}.js`
  - Re-test until successful
- Wait for the agent to complete before proceeding

**Agent Invocation:**

Use the Task tool with:
- `subagent_type`: `install-tester`
- `prompt`: `Test the {technology_name} installer following docs/TESTING_REQUIREMENTS.md. For each Docker platform (Ubuntu, Ubuntu Desktop, Debian, Amazon Linux, Fedora): 1) Call isEligible() first, 2) If false, record "not_eligible", 3) If true, call install() and record "pass" or "fail". Note: This is a {"desktop" if desktop else "non-desktop"} app. If any test returns "fail", fix the installer and re-test. Report the result for each environment.`

**Example for non-desktop app:**
```
Use Task tool with subagent_type=install-tester:
"Test the docker installer following docs/TESTING_REQUIREMENTS.md. For each Docker platform (Ubuntu, Ubuntu Desktop, Debian, Amazon Linux, Fedora): 1) Call isEligible() first, 2) If false, record 'not_eligible', 3) If true, call install() and record 'pass' or 'fail'. Note: This is a non-desktop app - expect 'pass' results on supported platforms. If any test returns 'fail', fix the installer and re-test. Report the result for each environment."
```

**Example for desktop app:**
```
Use Task tool with subagent_type=install-tester:
"Test the vscode installer following docs/TESTING_REQUIREMENTS.md. For each Docker platform (Ubuntu, Ubuntu Desktop, Debian, Amazon Linux, Fedora): 1) Call isEligible() first, 2) If false, record 'not_eligible', 3) If true, call install() and record 'pass' or 'fail'. Note: This is a desktop app - expect 'not_eligible' results in headless environments (ubuntu, debian, amazonlinux, fedora) and 'pass' in ubuntu-desktop. Report the result for each environment."
```

### Step 3: Verify Test Results

After the install-tester agent completes:

1. Review the agent's report
2. Confirm results for each testable platform:
   - For **non-desktop apps**: Should be `"pass"` on all supported platforms
   - For **desktop apps**: Should be `"not_eligible"` on headless platforms and `"pass"` on `ubuntu-desktop`
3. Confirm untestable platforms were skipped (not failed):
   - macOS: SKIPPED (no Docker support)
   - Windows: SKIPPED (no Docker support)
   - Git Bash: SKIPPED (no Docker support)
   - Raspberry Pi OS: SKIPPED (no Dockerfile)
4. If any result is `"fail"`:
   - Do NOT proceed to Step 4
   - Resume the install-tester agent to continue fixing and testing
   - Repeat until no `"fail"` results remain
5. Only proceed to Step 4 when all results are valid (`"pass"` or `"not_eligible"`)

### Step 4: Record Test Results

After all testable platforms have valid results:

1. Read `src/installs/installers.json`
2. Find the entry for the tested technology
3. Update the `test_results` array with the results from each environment:

```json
"test_results": [
  { "environment": "ubuntu", "result": "pass" },
  { "environment": "ubuntu-desktop", "result": "pass" },
  { "environment": "debian", "result": "pass" },
  { "environment": "amazonlinux", "result": "pass" },
  { "environment": "fedora", "result": "pass" }
]
```

Or for desktop apps:

```json
"test_results": [
  { "environment": "ubuntu", "result": "not_eligible" },
  { "environment": "ubuntu-desktop", "result": "pass" },
  { "environment": "debian", "result": "not_eligible" },
  { "environment": "amazonlinux", "result": "not_eligible" },
  { "environment": "fedora", "result": "not_eligible" }
]
```

4. Write the updated JSON back to the file

### Step 5: Update Status and Check for More

After recording test results:

1. Read `src/installs/installers.json` again
2. Verify the `test_results` array has entries for all five Docker environments (ubuntu, ubuntu-desktop, debian, amazonlinux, fedora)
3. Verify there are NO `"fail"` results
4. Update the `status` from `"test-pending"` to `"ready"`
5. Write the updated JSON back to the file
6. Log the completion: `"Completed: {technology} - Status updated to ready"`
7. **Return to Step 1** to check for another test-pending technology

### Step 6: Final Summary

When no more test-pending technologies exist, provide a final summary:

```
## All Installer Tests Complete

**Technologies Tested:** {count}
**Fixes Applied:** {fixed_count}

### Testing Infrastructure Limitations

The following platforms were NOT tested due to Docker limitations:
- macOS (cannot run in Docker)
- Windows (cannot run in Docker)
- Git Bash (Windows-specific, cannot run in Docker)
- Raspberry Pi OS (no Dockerfile in testing infrastructure)

These platform-specific install functions should be manually verified.

### Test Results Summary

| Technology | Desktop | Ubuntu | Ubuntu Desktop | Debian | Amazon Linux | Fedora | Status |
|------------|---------|--------|----------------|--------|--------------|--------|--------|
| {name1} | No | pass | pass | pass | pass | pass | ready |
| {name2} | Yes | not_eligible | pass | not_eligible | not_eligible | not_eligible | ready |
| ... | ... | ... | ... | ... | ... | ... | ... |

### Fixes Applied During Testing

| Technology | Platform | Issue | Fix |
|------------|----------|-------|-----|
| {tech} | {platform} | {description} | {what was fixed} |
| ... | ... | ... | ... |

### Next Steps
- Review the installer fixes for correctness
- IMPORTANT: Manually test installers on macOS, Windows, and Raspberry Pi OS
- Desktop applications require manual testing on systems with GUI support
- Deploy the ready installers to production after manual verification
```

---

## Test Result Values (from docs/TESTING_REQUIREMENTS.md)

| Result | Description |
|--------|-------------|
| `pass` | The `install()` function completed successfully. The technology was installed and verified. |
| `fail` | The `install()` function encountered an error. Requires investigation and fixes before re-testing. |
| `not_eligible` | The `isEligible()` function returned `false`. The installer correctly determined it cannot run in this environment. |

**Important:** A `"not_eligible"` result for a desktop app in a headless Docker environment is **correct behavior** - the `isEligible()` check is working as designed.

## Status Definitions

| Status | Meaning |
|--------|---------|
| `test-pending` | Awaiting testing - no valid test results yet |
| `ready` | Fully tested with valid results for all Docker environments (no `"fail"` results) |

## What the install-tester Agent Does

For each technology, the agent will:

1. Read the installer script (`src/installs/{technology}.js`)
2. Read the testing requirements (`docs/TESTING_REQUIREMENTS.md`)
3. Check the `testing/` folder for available Docker test harnesses
4. For each Docker environment (Ubuntu, Debian, Amazon Linux, Fedora):
   a. Call `isEligible()` to check if the installer can run
   b. If `isEligible()` returns `false`: Record `"not_eligible"`
   c. If `isEligible()` returns `true`: Call `install()` and record `"pass"` or `"fail"`
5. Skip platforms without Docker support (macOS, Windows, Git Bash, Raspberry Pi OS)
6. If any result is `"fail"`:
   - Analyze the error
   - Read the documentation (`src/installs/{technology}.md`) for guidance
   - Fix the installer code
   - Re-run the test on the failing platform
   - Repeat until the result is `"pass"`
7. Report the final results for all environments

## Important Rules

1. **Follow TESTING_REQUIREMENTS.md**: This document defines the authoritative testing specifications
2. **Sequential only**: Process ONE technology at a time - never parallel
3. **Complete before continuing**: The install-tester agent must fully complete before moving to the next technology
4. **No "fail" results allowed**: Any `"fail"` must be fixed and re-tested before proceeding
5. **"not_eligible" is valid**: For desktop apps in headless environments, this is the expected result
6. **Skip untestable platforms**: Do not attempt to test macOS, Windows, Git Bash, or Raspberry Pi OS
7. **Agent fixes issues**: The agent is responsible for fixing any installer problems it finds
8. **Record all results**: The `test_results` array must have entries for all four Docker environments
9. **Always update status**: The JSON file must be updated to "ready" after successful testing
10. **Report fixes**: Track what fixes were applied during testing for the final summary
11. **Track progress**: Maintain a list of tested technologies for the final summary
12. **No early exit**: Continue until all test-pending technologies have been processed

## Docker Testing Infrastructure Reference

The testing infrastructure is located in the `testing/` folder at the project root:

```
testing/
├── test.sh                      # Main test runner script
├── docker-compose.yml           # Container orchestration
├── Dockerfile.ubuntu            # Ubuntu 22.04 test image (headless)
├── Dockerfile.ubuntu-desktop    # Ubuntu 22.04 test image (Xvfb + GNOME desktop)
├── Dockerfile.debian            # Debian 12 test image (headless)
├── Dockerfile.amazonlinux       # Amazon Linux 2023 test image (headless)
├── Dockerfile.fedora            # Fedora 39 test image (headless)
└── scripts/
    ├── run-tests.sh             # Container test runner
    ├── test-install.sh          # Install command tests
    └── ...
```

### Running Tests Manually

```bash
# Test a specific installer
docker compose -f testing/docker-compose.yml run --rm ubuntu node -e "
  const installer = require('./src/installs/{technology}.js');
  (async () => {
    const eligible = installer.isEligible();
    console.log('isEligible:', eligible);
    if (eligible) {
      await installer.install();
      const installed = await installer.isInstalled();
      console.log('isInstalled:', installed);
      console.log('Result: ' + (installed ? 'pass' : 'fail'));
    } else {
      console.log('Result: not_eligible');
    }
  })();
"

# Open interactive shell for debugging
./testing/test.sh --shell ubuntu
```
