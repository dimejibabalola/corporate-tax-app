---
description: visual-verify
---

---
description: Visual verification of deployed app
globs: []
alwaysApply: false
---

# Visual Verify

**Purpose:** Check that the deployed app works visually.

## Steps

1. **Navigate to deployed URL**
   - Go to the Vercel deployment URL (NOT localhost)
   - Wait up to 30 seconds for page to load

2. **Login if needed**
   - Read `.env.local` for `USER_EMAIL` and `USER_PASSWORD`
   - If credentials missing, ask user
   - Enter credentials and click Login
   - If login fails, STOP and report the error - do not retry

3. **Verify the feature**
   - Navigate to the specific page/feature being tested
   - Take ONE screenshot
   - Check if it matches expectations

4. **Report result**
   - **PASS:** "Visual verification passed. [brief description of what you saw]"
   - **FAIL:** "Verification failed. [specific error or mismatch]" → Call `/debug`

## Hard Rules
- Maximum 2 screenshots total
- Do NOT create new accounts
- Do NOT retry failed logins - report and stop
- Do NOT screenshot loading spinners - wait for content
