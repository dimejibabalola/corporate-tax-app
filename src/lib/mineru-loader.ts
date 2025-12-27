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
 * Load a chapter's content - currently disabled
 * Returns null as MinerU data has been removed
 */
export async function loadMinerUChapter(
    chapterNum: number,
    _basePath: string = '/data/mineru'
): Promise<ParsedChapter | null> {
    console.log(`[MinerU] Content loading disabled for Chapter ${chapterNum}`);
    return null;
}

/**
 * Convert parsed chapter blocks to markdown string
 */
export function chapterBlocksToMarkdown(_chapter: ParsedChapter): string {
    return '';
}
