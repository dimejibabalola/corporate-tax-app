---
description: new-feature
---

---
description: Process for building new features
globs: []
alwaysApply: false
---

# New Feature

**Purpose:** Standard process for implementing features.

## Steps

1. **Setup tracking**
   - Run: `dctx track "feature name"`
   - Edit `spec.md` with requirements
   - Edit `plan.md` with implementation steps

2. **Implement**
   - Work through plan steps in order
   - Check off `[x]` as completed
   - Commit after each step

3. **Code standards**
   - TypeScript for frontend
   - Python for backend/ML
   - Always include error handling
   - Comment complex logic

4. **Complete**
   - Run: `dctx done` when finished
   - Create PR if using git branches

## Git Workflow (optional)
- Branch: `track/<track-id>-<name>`
- Commit after each plan step
- PR when track is done
