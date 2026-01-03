---
description: Orchestrator
---

---
description: Master entry point - routes to correct workflow
globs: []
alwaysApply: false
---

# Orchestrator

**Purpose:** Analyze user intent and route to the correct workflow.

## Steps

1. **Load Context**
   - Run `dctx status` to check current track
   - Run `dctx prompt` to load project context
   - Read `AI_RULES.md` and `README.md`

2. **Route by Intent**
   | User wants to... | Call workflow |
   |------------------|---------------|
   | Create a new page/route | `/new-page` |
   | Start a new feature | `/feature-start` |
   | Fix a bug or error | `/debug` |
   | Change database/schema | `/supabase-crud` |
   | Setup realtime sync | `/setup-realtime` |
   | Refresh context | `/context-refresh` |
   | Deploy to Vercel | `/deploy` |
   | Verify deployment visually | `/visual-verify` |

3. **Standard Execution (if no workflow matches)**
   - Check `package.json` for installed libraries
   - Use shadcn/ui components per `workflow.md`
   - Proceed with the task directly

4. **After completion**
   - Ask: "Task complete. Should I update the dctx plan?"
   - Ask: "Want me to run `/visual-verify` on the deployment?"
