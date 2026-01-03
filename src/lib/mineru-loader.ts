/**
 * MinerU Content Loader (Placeholder)
 * 
 * MinerU content has been temporarily disabled.
 * This file provides stub functions for compatibility.
 */

import { ContentBlock } from '@/types/reader';

// ============================================================================
// MinerU Block Types
// ============================================================================

export interface MinerUBlock {
    type: string;
    text?: string;
    text_level?: number;
    bbox?: number[];
    page_idx: number;
}

export interface ParsedChapter {
    chapterNum: number;
    blocks: ContentBlock[];
    pageCount: number;
    blocksByPage: Map<number, ContentBlock[]>;
    rawBlocks: MinerUBlock[];
    rawBlocksByPage: Map<number, MinerUBlock[]>;
}


/**
 * Load a chapter's content from local JSON
 */
export async function loadMinerUChapter(
    chapterNum: number,
    basePath: string = '/data/mineru'
): Promise<ParsedChapter | null> {
    const chapterId = `Ch${chapterNum}`;
    const url = `${basePath}/${chapterId}/content_list.json`;

    try {
        console.log(`[MinerU] Fetching chapter ${chapterNum} from ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`[MinerU] Failed to load chapter ${chapterNum}: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (!data || !Array.isArray(data)) {
            console.warn(`[MinerU] Invalid data format for chapter ${chapterNum}`);
            return null;
        }

        // Transform MinerU blocks to our internal format if needed
        // For now, we return the raw blocks packaged in the expected structure
        const rawBlocks = data as MinerUBlock[];

        // rudimentary block organization by page
        const rawBlocksByPage = new Map<number, MinerUBlock[]>();

        // Assuming page_idx is 0-based in MinerU output
        rawBlocks.forEach(block => {
            const page = block.page_idx || 0;
            if (!rawBlocksByPage.has(page)) {
                rawBlocksByPage.set(page, []);
            }
            rawBlocksByPage.get(page)?.push(block);
        });

        // Placeholder for converted ContentBlocks - we'll rely on raw JSON rendering for now
        // as implemented in the import-textbook.ts logic
        const blocks: ContentBlock[] = [];
        const blocksByPage = new Map<number, ContentBlock[]>();

        return {
            chapterNum,
            blocks,
            pageCount: rawBlocksByPage.size,
            blocksByPage,
            rawBlocks,
            rawBlocksByPage
        };

    } catch (err) {
        console.error(`[MinerU] Error loading chapter ${chapterNum}`, err);
        return null;
    }
}

/**
 * Convert parsed chapter blocks to markdown string
 * (Simple implementation if needed, otherwise empty)
 */
export function chapterBlocksToMarkdown(chapter: ParsedChapter): string {
    return chapter.rawBlocks
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\\n\\n');
}

