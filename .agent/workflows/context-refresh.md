---
description: Context Refresh
---

---
description: Reload context when agent seems confused
globs: []
alwaysApply: false
---

# Context Refresh

**Purpose:** Force reload of project context when the agent hallucinates or forgets.

## Steps

1. **Reload context**
   - Run: `dctx prompt`
   - Run: `dctx status`

2. **Verify loaded**
   - Check that `AI_RULES.md` is read
   - Check that `README.md` is read
   - Check that `package.json` dependencies are known

3. **Output status**
   ```
   - Current Track: <from dctx status>
   - Last Completed Step: <from plan.md>
   - Next Action: <what needs to happen>
   ```
