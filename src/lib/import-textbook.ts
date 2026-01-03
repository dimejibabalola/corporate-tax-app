/**
 * Import Textbook from MinerU 2.6 Content
 * 
 * Priority:
 * 1. Try loading from Supabase (for deployed app)
 * 2. Fall back to local MinerU JSON files (for development)
 * 
 * Expected file structure (for local):
 * /public/data/mineru/Ch{N}/
 *   - content_list.json (primary content)
 *   - images/ (extracted images)
 */

import { db, TextbookPage, PageFootnote, Section, Subsection } from './db';
import { v4 as uuidv4 } from 'uuid';
import { loadMinerUChapter, chapterBlocksToMarkdown, ParsedChapter, MinerUBlock } from './mineru-loader';
import { initializeFromSupabase, syncSupabaseToLocal, ensureTextbookForUser } from './supabase-loader';
import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ImportResult {
    success: boolean;
    pagesCount: number;
    footnotesCount: number;
    message: string;
    alreadyImported?: boolean;
}

interface ChapterDef {
    number: number;
    title: string;
    startPage: number;
    endPage: number;
    jsonPath?: string;
}

/**
 * Parsed section from MinerU text_level=1 blocks
 */
interface ParsedSection {
    letter: string;       // "A", "B", "C", etc.
    title: string;        // Full title text
    startPageIdx: number; // MinerU page_idx (0-indexed)
    endPageIdx?: number;  // Filled when next section starts
    subsections: ParsedSubsection[];
}

interface ParsedSubsection {
    number: number;       // 1, 2, 3, etc.
    title: string;
    startPageIdx: number;
    endPageIdx?: number;
}

// ============================================================================
// TEXTBOOK STRUCTURE (Page Ranges for Each Chapter)
// ============================================================================

const CHAPTER_DEFINITIONS: ChapterDef[] = [
    { number: 1, title: 'An Overview of the Taxation of Corporations and Shareholders', startPage: 3, endPage: 68 },
    { number: 2, title: 'Formation of a Corporation', startPage: 71, endPage: 168, jsonPath: '/parsed-chapters/Ch2_Formation_of_Corp/64b0aa02-6cda-4292-932c-1b3c35e2a36e_content_list.json' },
    { number: 3, title: 'Capital Structure', startPage: 169, endPage: 207, jsonPath: '/parsed-chapters/Ch3_Capital_Structure/06179aeb-2683-449c-b040-828ac9412c90_content_list.json' },
    { number: 4, title: 'Nonliquidating Distributions', startPage: 209, endPage: 274, jsonPath: '/parsed-chapters/Ch4_Nonliquidating_Distributions/d4cea686-0820-45c1-aa94-43ac539cf7c8_content_list.json' },
    { number: 5, title: 'Redemptions and Partial Liquidations', startPage: 275, endPage: 346, jsonPath: '/parsed-chapters/Ch5_Redemptions_and_Partial_Liq/e3b2a5b9-0e2d-4ccf-81d4-f55f11e643c5_content_list.json' },
    { number: 6, title: 'Stock Dividends and Section 306 Stock', startPage: 347, endPage: 381, jsonPath: '/parsed-chapters/Ch6_Stock_Dividends_and_Sec_306/8509b02e-478b-437f-a789-eb3974bde042_content_list.json' },
    { number: 7, title: 'Complete Liquidations', startPage: 383, endPage: 426, jsonPath: '/parsed-chapters/Ch7_Complete_Liquidations/1c630aed-8a7e-44c9-9e91-56bd8dd6715b_content_list.json' },
    { number: 8, title: 'Taxable Corporate Acquisitions', startPage: 427, endPage: 471, jsonPath: '/parsed-chapters/Ch8_Taxable_Corp_Acquisitions/f715e702-c229-4890-baa8-3f021871e711_content_list.json' },
    { number: 9, title: 'Acquisitive Reorganizations', startPage: 473, endPage: 565, jsonPath: '/parsed-chapters/Ch9_Acquisitive_Reorgs/32deec7b-4088-464e-aacd-239043f0f0e5_content_list.json' },
    { number: 10, title: 'Corporate Divisions', startPage: 567, endPage: 634, jsonPath: '/parsed-chapters/Ch10_Corp_Divisions/2f63beec-c5aa-4c96-8430-84b19e9d0e1b_content_list.json' },
    { number: 11, title: 'Nonacquisitive, Nondivisive Reorganizations', startPage: 635, endPage: 661, jsonPath: '/parsed-chapters/Ch11_Nonacquisitive_Reorgs/a8a4acff-bf7f-4458-a5f2-cc24494e8c28_content_list.json' },
    { number: 12, title: 'Carryovers of Corporate Tax Attributes', startPage: 663, endPage: 730, jsonPath: '/parsed-chapters/Ch12_Carryovers_of_Attributes/83f0985e-ebce-43bd-a145-6c01596705c6_content_list.json' },
    { number: 13, title: 'Affiliated Corporations', startPage: 731, endPage: 785, jsonPath: '/parsed-chapters/Ch13_Affiliated_Corps/6c40e00f-c176-43e4-9e2f-afa9d0f1d232_content_list.json' },
    { number: 14, title: 'Anti-Avoidance Rules', startPage: 787, endPage: 834, jsonPath: '/parsed-chapters/Ch14_Anti_Avoidance_Rules/5fafc1e9-2aa6-4cdc-84d1-6e66b24970e8_content_list.json' },
    { number: 15, title: 'S Corporations', startPage: 835, endPage: 910, jsonPath: '/parsed-chapters/Ch15_S_Corporations/94297318-07a2-425e-abd3-6151aa789283_content_list.json' },
];

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Check if textbook pages have already been imported
 */
export async function isTextbookImported(): Promise<boolean> {
    const count = await db.textbookPages.count();
    return count > 0;
}

/**
 * Clear all imported textbook data
 */
export async function clearImportedTextbook(): Promise<void> {
    console.log('[MinerU Import] Clearing all textbook data...');
    await db.textbookPages.clear();
    await db.pageFootnotes.clear();
    await db.chapters.clear();
    await db.sections.clear();
    await db.subsections.clear();
    localStorage.removeItem('textbookImported');
    localStorage.removeItem('mineruImportVersion');
    console.log('[MinerU Import] All data cleared');
}

// ============================================================================
// SECTION PARSING - Extract sections from MinerU text_level=1 blocks
// ============================================================================

/**
 * Regex patterns for detecting section types:
 * - Main sections: "A.", "B.", "C.", etc. or "A. TITLE", "B. TITLE"
 * - Subsections: "1.", "2.", "3.", etc. or "1. TITLE", "2. TITLE"
 * - Sub-subsections: "a.", "b.", "c.", etc.
 */
const SECTION_PATTERN = /^([A-H])\.\s+(.+)/i;          // Matches "A. Title" through "H. Title"
const SUBSECTION_PATTERN = /^(\d+)\.\s+(.+)/;          // Matches "1. Title", "2. Title", etc.
const SUBSUBSECTION_PATTERN = /^([a-z])\.\s+(.+)/i;   // Matches "a. Title", "b. Title", etc.

/**
 * Parse sections and subsections from MinerU blocks
 */
function parseChapterSections(rawBlocks: MinerUBlock[], chapterStartPage: number): ParsedSection[] {
    const sections: ParsedSection[] = [];
    let currentSection: ParsedSection | null = null;
    let currentSubsection: ParsedSubsection | null = null;

    // Filter to only text blocks with text_level = 1 (H1 headers)
    for (const block of rawBlocks) {
        if (block.type !== 'text') continue;
        const textBlock = block;
        if (textBlock.text_level !== 1) continue;

        const text = textBlock.text?.trim() || '';
        const pageIdx = textBlock.page_idx || 0;

        // Check for main section (A., B., C., etc.)
        const sectionMatch = text.match(SECTION_PATTERN);
        if (sectionMatch) {
            // Close previous section's page range
            if (currentSection) {
                currentSection.endPageIdx = pageIdx - 1;
                if (currentSubsection) {
                    currentSubsection.endPageIdx = pageIdx - 1;
                }
            }

            // Start new section
            currentSection = {
                letter: sectionMatch[1].toUpperCase(),
                title: sectionMatch[2].trim().replace(/\s+/g, ' '),
                startPageIdx: pageIdx,
                subsections: [],
            };
            currentSubsection = null;
            sections.push(currentSection);
            console.log(`[Section Parser] Found section ${currentSection.letter}: ${currentSection.title.substring(0, 40)}... (page_idx: ${pageIdx})`);
            continue;
        }

        // Check for subsection (1., 2., 3., etc.)
        const subsectionMatch = text.match(SUBSECTION_PATTERN);
        if (subsectionMatch && currentSection) {
            // Close previous subsection's page range
            if (currentSubsection) {
                currentSubsection.endPageIdx = pageIdx - 1;
            }

            currentSubsection = {
                number: parseInt(subsectionMatch[1], 10),
                title: subsectionMatch[2].trim().replace(/\s+/g, ' '),
                startPageIdx: pageIdx,
            };
            currentSection.subsections.push(currentSubsection);
            console.log(`[Section Parser]   Found subsection ${currentSection.letter}.${currentSubsection.number}: ${currentSubsection.title.substring(0, 30)}...`);
        }
    }

    // Close the last section/subsection
    if (currentSection) {
        const lastPageIdx = Math.max(...rawBlocks.map(b => b.page_idx || 0));
        currentSection.endPageIdx = lastPageIdx;
        if (currentSubsection) {
            currentSubsection.endPageIdx = lastPageIdx;
        }
    }

    console.log(`[Section Parser] Extracted ${sections.length} sections`);
    return sections;
}

/**
 * Get the section a page belongs to based on page_idx
 */
function findSectionForPage(pageIdx: number, sections: ParsedSection[]): ParsedSection | null {
    for (const section of sections) {
        if (pageIdx >= section.startPageIdx && (section.endPageIdx === undefined || pageIdx <= section.endPageIdx)) {
            return section;
        }
    }
    return sections[0] || null; // Default to first section if not found
}

// ============================================================================
// MAIN IMPORT FUNCTION
// ============================================================================

/**
 * Import textbook data - tries Supabase first, then local MinerU JSON
 */
export async function importTextbookFromJSON(): Promise<ImportResult> {
    try {
        // Check if data already exists
        const existingPages = await db.textbookPages.count();

        if (existingPages > 0) {
            console.log('[Import] Data already exists, skipping import');

            // FIX: Ensure textbook record exists for current user even if pages are loaded
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await ensureTextbookForUser(user.id);
            }

            return {
                success: true,
                pagesCount: existingPages,
                footnotesCount: 0,
                message: 'Data already loaded',
                alreadyImported: true,
            };
        }

        // Try Supabase first (for deployed app)
        console.log('[Import] Trying Supabase...');
        try {
            const supabaseResult = await syncSupabaseToLocal();
            if (supabaseResult.success && supabaseResult.pages > 0) {
                console.log('[Import] Loaded from Supabase:', supabaseResult.message);

                // Ensure textbook record exists for current user
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await ensureTextbookForUser(user.id);
                }

                return {
                    success: true,
                    pagesCount: supabaseResult.pages,
                    footnotesCount: 0,
                    message: supabaseResult.message,
                };
            }
        } catch (supabaseError) {
            console.log('[Import] Supabase unavailable, falling back to local JSON');
        }

        // Fall back to local MinerU JSON files
        console.log('[MinerU Import] Starting local JSON import...');

        // [FIX] Ensure textbook record exists for current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await ensureTextbookForUser(user.id);
        }

        localStorage.setItem('mineruImportComplete', 'false');

        console.log('[MinerU Import] Starting MinerU-only import with section extraction...');

        let totalPages = 0;
        let totalSections = 0;
        let totalFootnotes = 0;
        let chaptersLoaded = 0;

        // Process each chapter
        for (const chapterDef of CHAPTER_DEFINITIONS) {
            // SKIP Chapter 1 as requested
            if (chapterDef.number === 1) {
                console.log('[MinerU Import] Skipping Chapter 1 (via request)');
                continue;
            }

            // Skip if no JSON path defined (shouldn't happen for 2-15)
            if (!chapterDef.jsonPath) {
                console.warn(`[MinerU Import] No JSON path for Ch${chapterDef.number}`);
                continue;
            }

            const chapterId = `ch-${chapterDef.number}`;

            // Load MinerU content from specific path
            const mineruChapter = await loadMinerUChapter(
                chapterDef.number,
                undefined,
                chapterDef.jsonPath
            );

            if (mineruChapter && mineruChapter.rawBlocks && mineruChapter.rawBlocks.length > 0) {
                // Success! Use MinerU structured content
                console.log(`[MinerU Import] Ch${chapterDef.number}: Loaded ${mineruChapter.rawBlocks.length} blocks from ${chapterDef.jsonPath}`);

                // Parse sections from raw MinerU blocks
                const parsedSections = parseChapterSections(mineruChapter.rawBlocks, chapterDef.startPage);

                // Create Section records in database
                const sectionRecords: Section[] = [];
                const subsectionRecords: Subsection[] = [];

                for (const ps of parsedSections) {
                    const sectionId = `${chapterId}-${ps.letter}`;
                    const sectionStartPage = chapterDef.startPage + ps.startPageIdx;
                    const sectionEndPage = ps.endPageIdx !== undefined
                        ? chapterDef.startPage + ps.endPageIdx
                        : chapterDef.endPage;

                    sectionRecords.push({
                        id: sectionId,
                        textbookId: 'corporate-tax',
                        chapterId,
                        letter: ps.letter,
                        title: ps.title,
                        startPage: sectionStartPage,
                        endPage: sectionEndPage,
                    });

                    // Create Subsection records
                    for (const sub of ps.subsections) {
                        const subsectionId = `${sectionId}-${sub.number}`;
                        const subStartPage = chapterDef.startPage + sub.startPageIdx;
                        const subEndPage = sub.endPageIdx !== undefined
                            ? chapterDef.startPage + sub.endPageIdx
                            : sectionEndPage;

                        subsectionRecords.push({
                            id: subsectionId,
                            textbookId: 'corporate-tax',
                            sectionId,
                            number: sub.number,
                            title: sub.title,
                            startPage: subStartPage,
                            endPage: subEndPage,
                        });
                    }
                }

                // Bulk insert sections and subsections
                if (sectionRecords.length > 0) {
                    await db.sections.bulkPut(sectionRecords);
                    totalSections += sectionRecords.length;
                    console.log(`[MinerU Import] Ch${chapterDef.number}: Created ${sectionRecords.length} sections, ${subsectionRecords.length} subsections`);
                }
                if (subsectionRecords.length > 0) {
                    await db.subsections.bulkPut(subsectionRecords);
                }

                // -----------------------------------------------------------
                // EXTRACT FOOTNOTES
                // -----------------------------------------------------------
                const pageFootnotes: PageFootnote[] = [];

                // Identify footnote blocks
                const footnoteBlocks = mineruChapter.rawBlocks.filter(b =>
                    b.type === 'page_footnote' ||
                    (b.type === 'text' && b.text && /^\d+\s+/.test(b.text) && (b.bbox?.[1] || 0) > 800) // Fallback for bottom-of-page text
                );

                for (const fb of footnoteBlocks) {
                    if (!fb.text) continue;

                    // Simple parsing: separate number from text
                    // If type is explicitly 'page_footnote', trust the content
                    // Check for leading number
                    const match = fb.text.trim().match(/^(\d+)\s+(.+)/s);
                    let footNumber = 0;
                    let footText = fb.text;

                    if (match) {
                        footNumber = parseInt(match[1]);
                        footText = match[2];
                    }

                    // Assign to the correct page
                    const pageNum = chapterDef.startPage + (fb.page_idx || 0);
                    // Generate a deterministic ID based on chapter, page, and content hash/index
                    // (using uuid for now for simplicity)

                    pageFootnotes.push({
                        id: uuidv4(),
                        pageId: uuidv4(), // Placeholder, will fix when creating pages
                        footnoteNumber: footNumber,
                        text: footText,
                        // temporary field to help linking (casted as any to avoid type error during temp storage)
                        _pageIdx: fb.page_idx
                    } as any);
                }


                // Create database entries for each page with correct section mapping
                const pages: TextbookPage[] = [];
                const pagesInChapter = chapterDef.endPage - chapterDef.startPage + 1;
                const chapterFootnotesToInsert: PageFootnote[] = [];

                for (let pageOffset = 0; pageOffset < pagesInChapter; pageOffset++) {
                    const bookPageNum = chapterDef.startPage + pageOffset;
                    const pageId = uuidv4();

                    // Find which section this page belongs to
                    const matchingSection = findSectionForPage(pageOffset, parsedSections);
                    const sectionId = matchingSection
                        ? `${chapterId}-${matchingSection.letter}`
                        : `${chapterId}-A`;
                    const sectionTitle = matchingSection?.title || chapterDef.title;

                    // Check if this page starts a new section
                    const startsSection = parsedSections.some(s => s.startPageIdx === pageOffset);

                    // Get RAW MinerU blocks for this page
                    const rawPageBlocks = mineruChapter.rawBlocksByPage.get(pageOffset) || [];

                    // Filter out footnotes from the main content logic if they duplicate
                    // (MinerU sometimes separates them, sometimes not. Use raw blocks as source of truth for rendering)

                    const pageContent = JSON.stringify(rawPageBlocks);

                    pages.push({
                        id: pageId,
                        chapterId,
                        sectionId,
                        sectionTitle,
                        pageNumber: bookPageNum,
                        content: pageContent,
                        startsNewSection: startsSection,
                    });

                    // Link footnotes for this page
                    const footnotesForThisPage = pageFootnotes.filter((f: any) => f._pageIdx === pageOffset);
                    for (const fn of footnotesForThisPage) {
                        chapterFootnotesToInsert.push({
                            id: fn.id,
                            pageId: pageId, // Link to actual page UUID
                            footnoteNumber: fn.footnoteNumber,
                            text: fn.text
                        });
                    }
                }

                // Bulk insert pages and footnotes
                await db.textbookPages.bulkPut(pages);
                if (chapterFootnotesToInsert.length > 0) {
                    await db.pageFootnotes.bulkPut(chapterFootnotesToInsert);
                    totalFootnotes += chapterFootnotesToInsert.length;
                }

                totalPages += pages.length;
                chaptersLoaded++;

            } else {
                console.warn(`[MinerU Import] Ch${chapterDef.number}: No content found at ${chapterDef.jsonPath}`);
            }

            // Create chapter entry
            await db.chapters.put({
                id: chapterId,
                textbookId: 'corporate-tax',
                partId: chapterDef.number <= 1 ? 'part-1' : 'part-2',
                number: chapterDef.number,
                title: chapterDef.title,
                startPage: chapterDef.startPage,
                endPage: chapterDef.endPage,
            });
        }


        // Mark import as complete
        localStorage.setItem('mineruImportComplete', 'true');
        localStorage.setItem('textbookImported', 'true');

        console.log(`[MinerU Import] Complete! ${totalPages} pages, ${totalSections} sections, ${totalFootnotes} footnotes from ${chaptersLoaded}/15 chapters`);

        return {
            success: true,
            pagesCount: totalPages,
            footnotesCount: totalFootnotes,
            message: `Imported ${totalPages} pages, ${totalSections} sections, ${totalFootnotes} footnotes`,
        };

    } catch (error) {
        console.error('[MinerU Import] Error:', error);
        // Clear completion flag so next load will retry
        localStorage.setItem('mineruImportComplete', 'false');
        return {
            success: false,
            pagesCount: 0,
            footnotesCount: 0,
            message: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

// ============================================================================
// EXPORTS FOR COMPATIBILITY
// ============================================================================

export { clearImportedTextbook as clearTextbook };

/**
 * Get pages within a specific page range
 */
export async function getPagesByRange(startPage: number, endPage: number): Promise<TextbookPage[]> {
    return await db.textbookPages
        .where('pageNumber')
        .between(startPage, endPage, true, true)
        .toArray();
}

/**
 * Get footnotes for specific page IDs
 */
export async function getFootnotesForPages(pageIds: string[]): Promise<PageFootnote[]> {
    if (!pageIds || pageIds.length === 0) return [];

    const footnotes: PageFootnote[] = [];
    for (const pageId of pageIds) {
        const pageFootnotes = await db.pageFootnotes
            .where('pageId')
            .equals(pageId)
            .toArray();
        footnotes.push(...pageFootnotes);
    }
    return footnotes;
}
