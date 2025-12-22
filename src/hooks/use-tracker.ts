import { useCallback } from 'react';
import { db, ActivityLog } from '@/lib/db';
import { useOutletContext } from 'react-router-dom';

// Helper to get userId if outside of Outlet context (rare but safe)
const getUserId = () => {
    // This is a fallback. Ideally passed from context.
    return "user_fallback"; 
};

export const useTracker = (userId: string) => {
  const logActivity = useCallback(async (type: ActivityLog['type'], details?: object) => {
    if (!userId) return;

    try {
      await db.activityLogs.add({
        userId,
        type,
        details: details ? JSON.stringify(details) : undefined,
        timestamp: new Date()
      });
      console.log(`[Tracker] Logged: ${type}`);
    } catch (err) {
      console.error("[Tracker] Failed to log activity:", err);
    }
  }, [userId]);

  return { logActivity };
};