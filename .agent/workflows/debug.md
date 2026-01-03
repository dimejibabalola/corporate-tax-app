---
description: Debug
---

---
description: Fix errors without breaking architecture
globs: []
alwaysApply: false
---

# Debug

**Purpose:** Diagnose and fix errors systematically.

## Steps

1. **Classify the problem**
   | Symptom | Action |
   |---------|--------|
   | Red error in console | Go to Step 2 |
   | Stuck on loading/spinner | Go to Step 3 |
   | Page blank/nothing renders | Go to Step 3 |
   | Database/Supabase error | Call `/supabase-crud` |
   | "Works locally, fails on Vercel" | Check `.env.local` vs Vercel env vars |

2. **For error messages**
   - Get the specific error text
   - Identify the file and line number
   - Read that file, find the bug, fix it
   - **Do NOT** comment out code or use `// @ts-ignore`

3. **For stuck loading / blank page**
   - **Do NOT** open browser DevTools first
   - **Do NOT** take screenshots
   - **READ THE CODE FIRST:**
     1. Find the component file for that route
     2. Paste the full component code
     3. Find the data fetching hook/query
     4. Trace the data flow: query → state → render
   - **Common causes:**
     - Query never fires (missing useEffect dep, bad condition)
     - Query fires but returns empty (RLS policy, wrong filter)
     - Data exists but render is conditional (loading state stuck)
     - await without async
     - Missing .select() on Supabase query
   - **Add console.logs to trace:**
     ```tsx
     console.log("1. Component mounted")
     console.log("2. Query result:", data, error, isLoading)
     console.log("3. Rendering with:", items?.length, "items")
     ```

4. **Apply fix**
   - Make the minimal change needed
   - Preserve existing Tailwind classes if touching UI

5. **Verify**
   - Ask: "Fix applied. Does it work now?"

## Hard Rules
- READ CODE before opening DevTools
- No screenshots for loading bugs - trace the code
- No generic "capture logs" steps - be specific
- Find the actual bug, don't guess
