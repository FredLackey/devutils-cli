---
description: Add missing isInstalled functions to all test-pending installer scripts
---

You are a Senior DevOps Engineer responsible for ensuring all installer scripts have proper installation verification functions. Your job is to validate and add `isInstalled` functions to installer scripts that are missing them.

## Your Mission

Process all technologies with `"status": "test-pending"` in the installer queue, validating that each has the required `isInstalled` functions. If functions are missing, the agent will research and implement them. Process technologies in parallel batches for efficiency.

---

## Workflow

Execute these steps IN ORDER:

### Step 1: Gather Test-Pending Technologies

1. Read `src/installs/installers.json`
2. Filter to find ALL entries with `"status": "test-pending"`
3. Create a list of technologies to process
4. If no test-pending technologies exist, report "No technologies require isInstalled validation" and stop

### Step 2: Process in Parallel Batches

Process technologies in batches of **5 at a time** for efficiency:

1. Take the next 5 technologies from your list (or fewer if less than 5 remain)
2. Launch **5 parallel installer-status-validator agents** - one for each technology
3. Wait for all 5 agents to complete
4. Record the results from each agent
5. Repeat until all technologies have been processed

**Agent Invocation:**

For each technology in the batch, use the Task tool with:
- `subagent_type`: `installer-status-validator`
- `prompt`: `Validate and implement isInstalled functions for {technology_name}`

**Example parallel batch:**
```
Launch 5 agents in parallel:
- Agent 1: "Validate and implement isInstalled functions for Docker"
- Agent 2: "Validate and implement isInstalled functions for Node.js"
- Agent 3: "Validate and implement isInstalled functions for VS Code"
- Agent 4: "Validate and implement isInstalled functions for Git"
- Agent 5: "Validate and implement isInstalled functions for Homebrew"
```

### Step 3: Collect and Categorize Results

As each batch completes, categorize the results:

**Category A - Functions Added:**
Technologies where the agent created or updated isInstalled functions

**Category B - Already Complete:**
Technologies that already had valid isInstalled functions (no changes needed)

**Category C - Failed:**
Technologies where the agent encountered errors or could not complete

### Step 4: Final Summary

After all batches are processed, provide a comprehensive summary:

```
## isInstalled Function Validation Complete

**Total Processed:** {total_count}
**Functions Added:** {added_count}
**Already Complete:** {complete_count}
**Failed:** {failed_count}

### Functions Added
| Technology | Script File | Notes |
|------------|-------------|-------|
| {name} | src/installs/{file}.js | Added all 6 platform functions |
| ... | ... | ... |

### Already Complete (No Changes Needed)
| Technology | Script File |
|------------|-------------|
| {name} | src/installs/{file}.js |
| ... | ... |

### Failed (Requires Manual Review)
| Technology | Script File | Error |
|------------|-------------|-------|
| {name} | src/installs/{file}.js | {error_description} |
| ... | ... | ... |

### Next Steps
- Review added isInstalled functions for correctness
- Manually fix any failed technologies
- Proceed with installation testing
```

---

## Important Rules

1. **Batch processing**: Always process in batches of 5 for efficiency
2. **Parallel execution**: Launch all agents in a batch simultaneously using parallel Task tool calls
3. **Wait for completion**: Wait for all agents in a batch to complete before starting the next batch
4. **Track everything**: Maintain running lists of added, complete, and failed technologies
5. **Don't modify status**: This command validates and adds functions but does NOT change the status in installers.json
6. **Report failures**: If an agent fails, record the error and continue with the remaining technologies

## What the installer-status-validator Agent Does

For each technology, the agent will:

1. Read the installer script (`src/installs/{technology}.js`)
2. Check if all required `isInstalled` functions exist:
   - `isInstalled()` - main dispatcher function
   - `isInstalled_macos()`
   - `isInstalled_ubuntu()`
   - `isInstalled_raspbian()`
   - `isInstalled_amazon_linux()`
   - `isInstalled_windows()`
   - `isInstalled_gitbash()`

3. If functions are missing:
   - Read the markdown documentation (`src/installs/{technology}.md`)
   - Analyze the install functions to determine verification approach
   - Use web search if needed for verification commands
   - Implement the missing functions using utilities from `src/utils/`
   - Add functions to the script file

4. Report what was found and what was done

## Expected Outcome

After this command completes, all test-pending installer scripts should have:
- A main `isInstalled()` function that detects the OS and delegates
- Six platform-specific `isInstalled_{platform}()` functions
- Proper use of utility functions from `src/utils/` for verification
- All functions exported in `module.exports`
