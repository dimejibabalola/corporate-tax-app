import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function useRealtimeSync(enabled: boolean = true) {
    useEffect(() => {
        if (!enabled) return;

        console.log('[Realtime] Initializing subscription...');

        const channel = supabase.channel('textbook-updates')
            // CHARPERS
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'chapters' },
                async (payload) => {
                    console.log('[Realtime] Chapter update:', payload);
                    if (payload.eventType === 'DELETE') {
                        if (payload.old.id) await db.chapters.delete(payload.old.id);
                    } else {
                        const ch = payload.new;
                        await db.chapters.put({
                            id: ch.id,
                            textbookId: ch.textbook_id || 'corporate-tax',
                            partId: ch.part_id || 'part-1',
                            number: ch.number,
                            title: ch.title,
                            startPage: ch.start_page,
                            endPage: ch.end_page,
                        } as any);
                    }
                }
            )
            // SECTIONS
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'sections' },
                async (payload) => {
                    console.log('[Realtime] Section update:', payload);
                    if (payload.eventType === 'DELETE') {
                        if (payload.old.id) await db.sections.delete(payload.old.id);
                    } else {
                        const sec = payload.new;
                        await db.sections.put({
                            id: sec.id,
                            textbookId: sec.textbook_id || 'corporate-tax',
                            chapterId: sec.chapter_id,
                            letter: sec.letter,
                            title: sec.title,
                            startPage: sec.start_page,
                            endPage: sec.end_page,
                        } as any);
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Connected to Supabase Realtime');
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('[Realtime] Failed to connect');
                }
            });

        return () => {
            console.log('[Realtime] Cleaning up subscription');
            supabase.removeChannel(channel);
        };
    }, [enabled]);
}
