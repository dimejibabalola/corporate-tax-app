---
description: Feature start
---

---
description: Initialize a new feature with dctx tracking
globs: []
alwaysApply: false
---

# Feature Start

**Purpose:** Start a new feature with proper tracking and planning.

## Steps

1. **Create track**
   - Ask: "What's the feature name?"
   - Run: `dctx track "<feature_name>"`
   - Run: `dctx prompt` to load context

2. **Write spec**
   - Ask: "Describe the requirements briefly"
   - Update `.dctx/tracks/<track>/spec.md` with requirements

3. **Write plan**
   - Break down into small, verifiable steps
   - Each step should be completable in 1-2 commits
   - Update `.dctx/tracks/<track>/plan.md`
   - Example:
     ```
     - [ ] Step 1: Create DB schema
     - [ ] Step 2: Create API endpoint
     - [ ] Step 3: Create UI component
     - [ ] Step 4: Wire up and test
     ```

4. **Confirm**
   - Output the plan
   - Ask: "Does this look right? Start with Step 1?"
