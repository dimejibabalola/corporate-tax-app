---
description: Supabase Crud
---

---
description: Generate types and hooks for Supabase table
globs: []
alwaysApply: false
---

# Supabase CRUD

**Purpose:** Generate Zod schemas, TypeScript types, and React Query hooks for a table.

## Steps

1. **Get table schema**
   - Ask: "Which Supabase table?"
   - Use Supabase MCP or ask user to paste SQL definition

2. **Generate Zod schema**
   ```typescript
   // src/integrations/supabase/schemas/<table>.ts
   import { z } from 'zod';
   
   export const TableSchema = z.object({
     id: z.string().uuid(),
     // ... columns
     created_at: z.string().nullable(),
   });
   
   export type Table = z.infer<typeof TableSchema>;
   ```

3. **Generate React Query hooks**
   ```typescript
   // src/integrations/supabase/hooks/use<Table>.ts
   export function use<Table>() {
     return useQuery({ ... });
   }
   
   export function useCreate<Table>() {
     return useMutation({ ... });
   }
   ```
   - Invalidate correct query keys on mutation success

4. **File placement**
   - Schemas: `src/integrations/supabase/schemas/`
   - Hooks: `src/integrations/supabase/hooks/`
