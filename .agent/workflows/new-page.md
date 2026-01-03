---
description: New-page
---

---
description: Create a new page and register in router
globs: []
alwaysApply: false
---

# New Page

**Purpose:** Create a new page component and add it to routing.

## Steps

1. **Create page file**
   - Ask: "What's the page name?" (e.g., "Settings")
   - Create `src/pages/<PageName>.tsx`
   - Use standard layout wrapper or `div` with `container mx-auto p-4`

2. **Add route**
   - Open `src/App.tsx`
   - Import the new page
   - Add `<Route>` entry
   - Verify path doesn't conflict with existing routes

3. **Add navigation (optional)**
   - Ask: "Add to main navigation menu?"
   - If yes, add link to Sidebar/Navbar component
   - Use appropriate `lucide-react` icon
