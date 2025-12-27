/**
 * MinerU 2.6 Content Loader
 *
 * Parses MinerU CLI output following the 2.6 specification:
 * - {filename}_content_list.json — Ordered content blocks
 *
 * Content Types:
 * - "text" with text_level: 0=body, 1=H1, 2=H2, etc.
 * - "table" with table_body (HTML), table_caption, table_footnote
 * - "image" with img_path, image_caption, image_footnote
 * - "equation" with text (LaTeX), img_path fallback
 *
 * Reference: https://opendatalab.github.io/MinerU/reference/output_files/
 */

import { ContentBlock } from '@/types/reader';
import { 
    extractFootnotesFromMiddleJson, 
    logExtractionSummary 
} from './footnote-extractor';

// ============================================================================
// MinerU Block Types (from content_list.json)
// ============================================================================

export interface MinerUTextBlock {
    type: 'text';
    text: string;
    text_level: number; // 0=body, 1=H1, 2=H2, etc.
    bbox?: number[];
    page_idx: number;
}

export interface MinerUTableBlock {
    type: 'table';
    img_path?: string;
    table_caption?: string[];
    table_footnote?: string[];
    table_body: string; // HTML
    bbox?: number[];
    page_idx: number;
}

export interface MinerUImageBlock {
    type: 'image';
    img_path: string;
    image_caption?: string[];
    image_footnote?: string[];
    bbox?: number[];
    page_idx: number;
}

export interface MinerUEquationBlock {
    type: 'equation';
    img_path?: string;
    text?: string; // LaTeX
    text_format?: string;
    bbox?: number[];
    page_idx: number;
}

export type MinerUBlock = MinerUTextBlock | MinerUTableBlock | MinerUImageBlock | MinerUEquationBlock | { type: 'page_footnote'; text?: string; bbox?: [number, number, number, number]; page_idx: number } | { type: 'discarded'; text?: string; bbox?: number[]; page_idx: number };

// ============================================================================
// Parsed Content Structure
// ============================================================================

export interface ParsedChapter {
    chapterNum: number;
    blocks: ContentBlock[];
    pageCount: number;
    blocksByPage: Map<number, ContentBlock[]>;
    rawBlocks: MinerUBlock[]; // Original MinerU blocks for section parsing
    rawBlocksByPage: Map<number, MinerUBlock[]>; // Raw blocks grouped by page for direct rendering
}

/**
 * Load footnotes from middle.json discarded_blocks
 * Delegates to the footnote-extractor module
 */
async function loadFootnotesFromMiddleJson(
    chapterNum: number,
    basePath: string = '/data/mineru'
): Promise<MinerUBlock[]> {
    const footnoteBlocks = await extractFootnotesFromMiddleJson(chapterNum, basePath);
    
    // Log extraction summary for debugging
    logExtractionSummary(footnoteBlocks, chapterNum);
    
    // Convert FootnoteBlock to MinerUBlock
    return footnoteBlocks.map(fn => ({
        type: 'page_footnote' as const,
        text: fn.text,
        bbox: fn.bbox,
        page_idx: fn.page_idx,
    }));
}

// ============================================================================
// FOOTNOTE HELPERS
// ============================================================================

// Note: Footnotes are now exclusively loaded from middle.json via footnote-extractor.ts
// The content_list.json "discarded" blocks are filtered out as duplicates

/**
 * Load a chapter's content from MinerU content_list.json
 *
 * @param chapterNum - Chapter number (1-15)
 * @param basePath - Base path to MinerU output (default: /data/mineru)
 * @returns Parsed chapter content or null if not found
 */
export async function loadMinerUChapter(
    chapterNum: number,
    basePath: string = '/data/mineru'
): Promise<ParsedChapter | null> {
    try {
        // Try loading content_list.json from the chapter directory
        const contentListUrl = `${basePath}/Ch${chapterNum}/content_list.json`;

        console.log(`[MinerU] Loading: ${contentListUrl}`);

        const response = await fetch(contentListUrl);
        if (!response.ok) {
            console.warn(`[MinerU] No content_list.json for Chapter ${chapterNum}`);
            return null;
        }

        const minerUBlocks: MinerUBlock[] = await response.json();

        if (!Array.isArray(minerUBlocks) || minerUBlocks.length === 0) {
            console.warn(`[MinerU] Empty content for Chapter ${chapterNum}`);
            return null;
        }

        console.log(`[MinerU] Loaded ${minerUBlocks.length} blocks for Chapter ${chapterNum}`);

        // Load footnotes from middle.json (primary source - properly extracted)
        const footnotes = await loadFootnotesFromMiddleJson(chapterNum, basePath);
        
        // Create a Set of footnote numbers we already have from middle.json
        const existingFootnoteNums = new Set<number>();
        for (const fn of footnotes) {
            const match = fn.text?.match(/^(\d{1,3})\s/);
            if (match) {
                existingFootnoteNums.add(parseInt(match[1]));
            }
        }
        
        console.log(`[MinerU] Loaded ${footnotes.length} footnotes from middle.json (nums: ${[...existingFootnoteNums].slice(0, 10).join(', ')}...)`);

        // Filter out "discarded" blocks from content_list.json that are duplicate footnotes
        // and don't convert text blocks to footnotes (middle.json has the canonical source)
        const filteredBlocks = minerUBlocks.filter(block => {
            // Skip discarded blocks that look like footnotes (they're duplicates from content_list.json)
            if (block.type === 'discarded') {
                const text = block.text?.trim() || '';
                const match = text.match(/^(\d{1,3})\s/);
                if (match) {
                    const num = parseInt(match[1]);
                    // Skip if it looks like a footnote number in range
                    if (num >= 1 && num <= 200) {
                        return false; // Filter out - we have this from middle.json
                    }
                }
            }
            return true;
        });
        
        console.log(`[MinerU] Filtered ${minerUBlocks.length - filteredBlocks.length} duplicate discarded blocks`);

        // Combine content blocks + footnotes
        // Footnotes will be sorted by number before being grouped by page
        const allBlocks = [...filteredBlocks, ...footnotes];

        // Convert MinerU blocks to our ContentBlock format
        const blocks: ContentBlock[] = [];
        const blocksByPage = new Map<number, ContentBlock[]>();
        const rawBlocksByPage = new Map<number, MinerUBlock[]>();
        let maxPageIdx = 0;

        for (const mineruBlock of allBlocks) {
            const pageIdx = mineruBlock.page_idx || 0;
            maxPageIdx = Math.max(maxPageIdx, pageIdx);

            // Group raw blocks by page
            if (!rawBlocksByPage.has(pageIdx)) {
                rawBlocksByPage.set(pageIdx, []);
            }
            rawBlocksByPage.get(pageIdx)!.push(mineruBlock);

            const contentBlock = convertMinerUBlock(mineruBlock, chapterNum, basePath);
            if (contentBlock) {
                blocks.push(contentBlock);

                if (!blocksByPage.has(pageIdx)) {
                    blocksByPage.set(pageIdx, []);
                }
                blocksByPage.get(pageIdx)!.push(contentBlock);
            }
        }
        
        // Sort footnotes within each page by their number
        for (const [pageIdx, pageBlocks] of rawBlocksByPage.entries()) {
            // Separate footnotes from other blocks
            const footnoteBlocks: MinerUBlock[] = [];
            const otherBlocks: MinerUBlock[] = [];
            
            for (const block of pageBlocks) {
                if (block.type === 'page_footnote') {
                    footnoteBlocks.push(block);
                } else {
                    otherBlocks.push(block);
                }
            }
            
            // Sort footnotes by their number
            footnoteBlocks.sort((a, b) => {
                const aMatch = a.text?.match(/^(\d+)/);
                const bMatch = b.text?.match(/^(\d+)/);
                const aNum = aMatch ? parseInt(aMatch[1]) : 0;
                const bNum = bMatch ? parseInt(bMatch[1]) : 0;
                return aNum - bNum;
            });
            
            // Recombine: other blocks first, then sorted footnotes
            rawBlocksByPage.set(pageIdx, [...otherBlocks, ...footnoteBlocks]);
        }

        return {
            chapterNum,
            blocks,
            pageCount: maxPageIdx + 1,
            blocksByPage,
            rawBlocks: allBlocks,
            rawBlocksByPage,
        };
    } catch (error) {
        console.error(`[MinerU] Error loading Chapter ${chapterNum}:`, error);
        return null;
    }
}

/**
 * Convert a MinerU block to our ContentBlock format
 */
function convertMinerUBlock(
    block: MinerUBlock,
    chapterNum: number,
    basePath: string
): ContentBlock | null {
    switch (block.type) {
        case 'text':
            return convertTextBlock(block);

        case 'table':
            return convertTableBlock(block);

        case 'image':
            return convertImageBlock(block, chapterNum, basePath);

        case 'equation':
            return convertEquationBlock(block, chapterNum, basePath);

        default:
            console.warn(`[MinerU] Unknown block type: ${(block as MinerUBlock).type}`);
            return null;
    }
}

/**
 * Calculate heading level from bbox height
 * bbox format: [x0, y0, x1, y1]
 * height = y1 - y0
 * 
 * Thresholds based on MinerU output analysis:
 * - height > 50 → H1 (large chapter/part titles like 114px, 92px)
 * - height > 21 → H2 (section headers like "A. INTRODUCTION" ~23px)
 * - height <= 21 → H3 (subsections like "1. THE CORPORATE INCOME TAX" ~18-21px)
 */
function getHeadingLevelFromBbox(bbox: number[] | undefined): 1 | 2 | 3 {
    if (!bbox || bbox.length < 4) {
        return 2; // Default to H2 if no bbox
    }

    const height = bbox[3] - bbox[1];

    if (height > 50) {
        return 1; // H1 - Large titles (chapter titles, part titles)
    } else if (height > 21) {
        return 2; // H2 - Section headers (A., B., C., etc.)
    } else {
        return 3; // H3 - Subsections (1., 2., 3., etc.)
    }
}

/**
 * Convert MinerU text block
 * Uses bbox height for heading hierarchy when text_level indicates a header.
 * Detects "CHAPTER X" and "PART" as eyebrow patterns (small labels above real title).
 */
function convertTextBlock(block: MinerUTextBlock): ContentBlock {
    const text = block.text?.trim() || '';
    const textUpper = text.toUpperCase();
    const height = block.bbox ? block.bbox[3] - block.bbox[1] : 0;

    // If text_level > 0, it's a heading - apply smart hierarchy
    if (block.text_level > 0) {

        // EYEBROW PATTERN: "CHAPTER X" or "PART" with small height
        // These are labels, not real headings
        if ((textUpper.startsWith('CHAPTER') || textUpper.startsWith('PART')) && height < 40) {
            console.log(`[MinerU] Eyebrow detected: "${text}" (height: ${height})`);
            return {
                type: 'eyebrow',
                text: text,
            };
        }

        // Determine heading level from bbox height
        const level = getHeadingLevelFromBbox(block.bbox);
        console.log(`[MinerU] Heading detected: "${text.substring(0, 50)}..." → H${level} (height: ${height})`);

        return {
            type: 'heading',
            level: level,
            text: text,
            anchor: slugify(text),
        };
    }

    // For body text (text_level = 0), use paragraph
    return {
        type: 'paragraph',
        html: formatInlineReferences(text),
    };
}

/**
 * Convert MinerU table block
 * Renders table_body HTML directly
 */
function convertTableBlock(block: MinerUTableBlock): ContentBlock {
    return {
        type: 'htmlTable',
        html: block.table_body || '',
        caption: block.table_caption?.join(' '),
        footnotes: block.table_footnote,
    };
}

/**
 * Convert MinerU image block
 */
function convertImageBlock(
    block: MinerUImageBlock,
    chapterNum: number,
    basePath: string
): ContentBlock {
    // Build full image path - paths are relative to chapter output dir
    const imgPath = block.img_path
        ? `${basePath}/Ch${chapterNum}/${block.img_path}`
        : '';

    return {
        type: 'image',
        src: imgPath,
        alt: block.image_caption?.join(' ') || 'Figure',
        caption: block.image_caption?.join(' '),
        footnotes: block.image_footnote,
    };
}

/**
 * Convert MinerU equation block
 */
function convertEquationBlock(
    block: MinerUEquationBlock,
    chapterNum: number,
    basePath: string
): ContentBlock {
    const imgPath = block.img_path
        ? `${basePath}/Ch${chapterNum}/${block.img_path}`
        : undefined;

    return {
        type: 'equation',
        latex: block.text,
        imageSrc: imgPath,
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);
}

/**
 * Add semantic markup for IRC sections and case references
 */
function formatInlineReferences(text: string): string {
    let html = text;

    // IRC Section references: § 351, Section 351
    html = html.replace(
        /(?:IRC\s*)?(?:§|Section)\s*(\d+[A-Za-z]?(?:\([a-z0-9]+\))?)/gi,
        '<span class="statute-ref" data-section="$1">§ $1</span>'
    );

    // Case references: Name v. Commissioner
    html = html.replace(
        /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*[a-z]*)?)\s+v\.\s+(Commissioner|United States|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
        '<span class="case-ref">$1 v. $2</span>'
    );

    // Treasury Regulations
    html = html.replace(
        /Treas(?:ury)?\.?\s*Reg(?:ulation)?s?\.?\s*§?\s*([\d.-]+)/gi,
        '<span class="reg-ref">Treas. Reg. § $1</span>'
    );

    return html;
}

/**
 * Convert parsed chapter blocks to markdown string (for backwards compatibility)
 */
export function chapterBlocksToMarkdown(chapter: ParsedChapter): string {
    const lines: string[] = [];

    for (const block of chapter.blocks) {
        switch (block.type) {
            case 'heading': {
                const hashes = '#'.repeat(block.level);
                lines.push(`${hashes} ${block.text}`);
                lines.push('');
                break;
            }
            case 'eyebrow':
                // Output HTML for eyebrow labels (CHAPTER X, PART X)
                lines.push(`<div class="chapter-eyebrow">${block.text}</div>`);
                lines.push('');
                break;
            case 'paragraph':
                lines.push(block.html);
                lines.push('');
                break;
            case 'htmlTable':
                lines.push(block.html);
                if (block.caption) lines.push(`*${block.caption}*`);
                lines.push('');
                break;
            case 'image':
                lines.push(`![${block.alt || 'Figure'}](${block.src})`);
                if (block.caption) lines.push(`*${block.caption}*`);
                lines.push('');
                break;
            case 'equation':
                if (block.latex) {
                    lines.push(`$$${block.latex}$$`);
                } else if (block.imageSrc) {
                    lines.push(`![Equation](${block.imageSrc})`);
                }
                lines.push('');
                break;
        }
    }

    return lines.join('\n');
}
