/**
 * Supabase Data Loader
 * Loads textbook content from Supabase instead of local JSON/IndexedDB
 */

import { supabase } from '@/integrations/supabase/client';
import { db, Chapter, Section, TextbookPage, Textbook, Part } from './db';

/**
 * Check if we should load from Supabase (if local DB is empty)
 */
export async function shouldLoadFromSupabase(): Promise<boolean> {
  const localPageCount = await db.textbookPages.count();
  return localPageCount === 0;
}

/**
 * Load all chapters from Supabase
 */
export async function loadChaptersFromSupabase(): Promise<Chapter[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .order('number');
  
  if (error) {
    console.error('[Supabase] Error loading chapters:', error);
    return [];
  }

  // Map Supabase format to local format
  return (data || []).map(ch => ({
    id: ch.id,
    textbookId: ch.textbook_id || 'corporate-tax',
    partId: ch.part_id || 'part-1',
    number: ch.number,
    title: ch.title,
    startPage: ch.start_page,
    endPage: ch.end_page,
  }));
}

/**
 * Load all sections from Supabase
 */
export async function loadSectionsFromSupabase(chapterId?: string): Promise<Section[]> {
  let query = supabase.from('sections').select('*');
  
  if (chapterId) {
    query = query.eq('chapter_id', chapterId);
  }
  
  const { data, error } = await query.order('id');
  
  if (error) {
    console.error('[Supabase] Error loading sections:', error);
    return [];
  }

  return (data || []).map(sec => ({
    id: sec.id,
    textbookId: sec.textbook_id || 'corporate-tax',
    chapterId: sec.chapter_id,
    letter: sec.letter,
    title: sec.title,
    startPage: sec.start_page,
    endPage: sec.end_page,
  }));
}

/**
 * Load textbook pages from Supabase
 */
export async function loadPagesFromSupabase(
  chapterId?: string,
  sectionId?: string
): Promise<TextbookPage[]> {
  let query = supabase.from('textbook_pages').select('*');
  
  if (chapterId) {
    query = query.eq('chapter_id', chapterId);
  }
  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }
  
  const { data, error } = await query.order('page_number');
  
  if (error) {
    console.error('[Supabase] Error loading pages:', error);
    return [];
  }

  return (data || []).map(page => ({
    id: page.id,
    pageNumber: page.page_number,
    chapterId: page.chapter_id,
    sectionId: page.section_id,
    sectionTitle: page.section_title,
    content: page.content,
    startsNewSection: page.starts_new_section || false,
  }));
}

/**
 * Sync Supabase data to local IndexedDB for offline use
 * Also creates the textbook and parts records needed by the UI
 */
export async function syncSupabaseToLocal(): Promise<{
  success: boolean;
  chapters: number;
  sections: number;
  pages: number;
  message: string;
}> {
  try {
    console.log('[Supabase] Starting sync from Supabase...');

    // Load from Supabase
    const chapters = await loadChaptersFromSupabase();
    const sections = await loadSectionsFromSupabase();
    const pages = await loadPagesFromSupabase();

    if (chapters.length === 0 && pages.length === 0) {
      return {
        success: false,
        chapters: 0,
        sections: 0,
        pages: 0,
        message: 'No data found in Supabase',
      };
    }

    console.log(`[Supabase] Loaded ${chapters.length} chapters, ${sections.length} sections, ${pages.length} pages`);

    // Clear local DB and insert Supabase data
    await db.chapters.clear();
    await db.sections.clear();
    await db.textbookPages.clear();

    if (chapters.length > 0) {
      await db.chapters.bulkPut(chapters);
    }
    if (sections.length > 0) {
      await db.sections.bulkPut(sections);
    }
    if (pages.length > 0) {
      await db.textbookPages.bulkPut(pages);
    }

    // Mark as imported
    localStorage.setItem('textbookImported', 'true');
    localStorage.setItem('supabaseSynced', 'true');
    localStorage.setItem('mineruImportComplete', 'true');

    console.log('[Supabase] Sync complete!');

    return {
      success: true,
      chapters: chapters.length,
      sections: sections.length,
      pages: pages.length,
      message: `Synced ${chapters.length} chapters, ${sections.length} sections, ${pages.length} pages from Supabase`,
    };
  } catch (error) {
    console.error('[Supabase] Sync error:', error);
    return {
      success: false,
      chapters: 0,
      sections: 0,
      pages: 0,
      message: `Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Ensure textbook and parts exist for a user
 * This creates the required records so the UI can display content
 */
export async function ensureTextbookForUser(userId: string): Promise<void> {
  const textbookId = 'corporate-tax';
  
  // Check if textbook already exists for this user
  const existing = await db.textbooks.where('userId').equals(userId).first();
  if (existing) {
    console.log('[Supabase] Textbook already exists for user');
    return;
  }

  console.log('[Supabase] Creating textbook record for user...');

  // Create textbook record
  const textbook: Textbook = {
    id: textbookId,
    userId: userId,
    title: 'Fundamentals of Corporate Taxation',
    fileName: 'corporate-tax-textbook',
    totalPages: 910,
    uploadDate: new Date(),
    processed: true,
  };

  await db.textbooks.put(textbook);

  // Create Parts
  const parts: Part[] = [
    { id: 'part-ONE', textbookId, number: 'ONE', title: 'INTRODUCTION', startPage: 1, endPage: 68 },
    { id: 'part-TWO', textbookId, number: 'TWO', title: 'TAXATION OF C CORPORATIONS', startPage: 69, endPage: 834 },
    { id: 'part-THREE', textbookId, number: 'THREE', title: 'TAXATION OF S CORPORATIONS', startPage: 835, endPage: 910 },
  ];

  await db.parts.bulkPut(parts);
  console.log('[Supabase] Created textbook and parts for user');
}

/**
 * Main initialization function - tries Supabase first, falls back to local JSON
 */
export async function initializeFromSupabase(): Promise<boolean> {
  const needsSync = await shouldLoadFromSupabase();
  
  if (!needsSync) {
    console.log('[Supabase] Local data exists, skipping sync');
    return true;
  }

  console.log('[Supabase] Local DB empty, loading from Supabase...');
  const result = await syncSupabaseToLocal();
  
  return result.success;
}
