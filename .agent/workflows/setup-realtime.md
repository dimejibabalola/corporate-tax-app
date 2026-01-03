---
description: setup-realtime
---

---
description: Setup Supabase realtime subscriptions
globs: []
alwaysApply: false
---

# Setup Realtime

**Purpose:** Add realtime data sync for a Supabase table.

## Steps

1. **Enable in Supabase**
   - Go to Database → Replication
   - Enable realtime for the target table

2. **Add subscription**
   ```tsx
   useEffect(() => {
     const channel = supabase
       .channel('table-changes')
       .on('postgres_changes', 
         { event: '*', schema: 'public', table: 'your_table' },
         (payload) => {
           if (payload.eventType === 'INSERT') {
             setData(prev => [...prev, payload.new]);
           }
           if (payload.eventType === 'UPDATE') {
             setData(prev => prev.map(item => 
               item.id === payload.new.id ? payload.new : item
             ));
           }
           if (payload.eventType === 'DELETE') {
             setData(prev => prev.filter(item => 
               item.id !== payload.old.id
             ));
           }
         }
       )
       .subscribe();
     
     return () => { supabase.removeChannel(channel); };
   }, []);
   ```

3. **Tips**
   - Ensure RLS policies allow the subscription
   - Combine with React Query for initial fetch + realtime updates
