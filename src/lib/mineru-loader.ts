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
 * MinerU often misclassifies footnotes - they end up in discarded_blocks
 * 
 * Structure of middle.json:
 * - pdf_info[].discarded_blocks[].lines[].spans[].content
 * - Each line may start with a footnote number as a separate span
 * - Footnotes can span multiple lines within a block
 * 
 * @param chapterNum - Chapter number
 * @param basePath - Base path to MinerU output
 * @returns Array of footnote blocks with type 'page_footnote'
 */
async function loadFootnotesFromMiddleJson(
    chapterNum: number,
    basePath: string = '/data/mineru'
): Promise<MinerUBlock[]> {
    const footnotes: MinerUBlock[] = [];
    const maxFootnote = CHAPTER_FOOTNOTE_COUNT[`ch-${chapterNum}`] || 200;

    try {
        // Try common middle.json paths
        const middleJsonPaths = [
            `${basePath}/Ch${chapterNum}/Ch${chapterNum}_Intro_to_Corp_Tax/auto/Ch${chapterNum}_Intro_to_Corp_Tax_middle.json`,
            `${basePath}/Ch${chapterNum}/middle.json`,
        ];

        interface MiddleJsonSpan {
            content?: string;
            type?: string;
        }
        interface MiddleJsonLine {
            spans?: MiddleJsonSpan[];
            bbox?: number[];
        }
        interface MiddleJsonBlock {
            lines?: MiddleJsonLine[];
            bbox?: number[];
            type?: string;
        }
        interface MiddleJsonPage {
            page_idx?: number;
            page_size?: number[];
            discarded_blocks?: MiddleJsonBlock[];
        }
        interface MiddleJsonData {
            pdf_info?: MiddleJsonPage[];
        }

        let data: MiddleJsonData | null = null;

        for (const path of middleJsonPaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    data = await response.json();
                    console.log(`[MinerU] Found middle.json at: ${path}`);
                    break;
                }
            } catch {
                // Try next path
            }
        }

        if (!data?.pdf_info) {
            return footnotes;
        }

        // Track current footnote being built
        let currentFootnote: { number: number; text: string; pageIdx: number; bbox: number[] } | null = null;
        const collectedFootnotes: Map<number, { text: string; pageIdx: number; bbox: number[] }> = new Map();

        // Helper to save current footnote
        const saveCurrentFootnote = () => {
            if (!currentFootnote) return;
            const existing = collectedFootnotes.get(currentFootnote.number);
            if (existing) {
                existing.text += ' ' + currentFootnote.text;
            } else {
                collectedFootnotes.set(currentFootnote.number, {
                    text: currentFootnote.text,
                    pageIdx: currentFootnote.pageIdx,
                    bbox: currentFootnote.bbox,
                });
            }
        };

        // Helper to start a new footnote
        const startNewFootnote = (fnNum: number, text: string, pageIdx: number, bbox: number[]) => {
            saveCurrentFootnote();
            currentFootnote = { number: fnNum, text, pageIdx, bbox };
        };

        // Extract footnotes from discarded_blocks - process line by line
        for (const page of data.pdf_info) {
            const pageIdx = page.page_idx ?? 0;

            for (const block of page.discarded_blocks ?? []) {
                if (!block.lines) continue;
                const blockBbox = block.bbox ?? [0, 0, 0, 0];

                for (const line of block.lines) {
                    const spans = line.spans ?? [];
                    if (spans.length === 0) continue;

                    // Get line text
                    const lineText = spans.map(s => s.content ?? '').join(' ').trim();
                    if (!lineText) continue;

                    const firstSpan = spans[0];
                    const firstContent = (firstSpan.content ?? '').trim();

                    // CASE 1: First span is just a number (separate span for footnote number)
                    // e.g., spans: ["15", "See e.g., Subchapter M..."]
                    const separateNumberMatch = firstContent.match(/^(\d{1,3})$/);
                    if (separateNumberMatch) {
                        const fnNum = parseInt(separateNumberMatch[1]);
                        if (fnNum >= 1 && fnNum <= maxFootnote) {
                            const restText = spans.slice(1).map(s => s.content ?? '').join(' ').trim();
                            startNewFootnote(fnNum, restText, pageIdx, blockBbox);
                            continue;
                        }
                    }

                    // CASE 2: Footnote number merged with text (inline number at start)
                    // e.g., spans: ["16 See, e.g. Subchapter L..."]
                    const inlineNumberMatch = firstContent.match(/^(\d{1,3})\s+(.+)/);
                    if (inlineNumberMatch) {
                        const fnNum = parseInt(inlineNumberMatch[1]);
                        if (fnNum >= 1 && fnNum <= maxFootnote) {
                            // Extract the text after the number
                            const textAfterNum = inlineNumberMatch[2];
                            const restText = spans.length > 1
                                ? textAfterNum + ' ' + spans.slice(1).map(s => s.content ?? '').join(' ').trim()
                                : textAfterNum;
                            startNewFootnote(fnNum, restText, pageIdx, blockBbox);
                            continue;
                        }
                    }

                    // Not a new footnote - append to current if we have one
                    if (currentFootnote) {
                        currentFootnote.text += ' ' + lineText;
                    }
                }
            }
        }

        // Save last footnote
        saveCurrentFootnote();

        // Convert to MinerUBlock format, sorted by footnote number
        const sortedNumbers = Array.from(collectedFootnotes.keys()).sort((a, b) => a - b);
        for (const fnNum of sortedNumbers) {
            const fn = collectedFootnotes.get(fnNum)!;
            footnotes.push({
                type: 'page_footnote',
                text: `${fnNum} ${fn.text.replace(/\s+/g, ' ').trim()}`,
                bbox: fn.bbox as [number, number, number, number],
                page_idx: fn.pageIdx,
            });
        }

        console.log(`[MinerU] Recovered ${footnotes.length} footnotes from discarded_blocks (max expected: ${maxFootnote})`);

    } catch (error) {
        console.warn(`[MinerU] Could not load footnotes from middle.json:`, error);
    }

    return footnotes;
}

// ============================================================================
// FOOTNOTE DETECTION HELPERS
// ============================================================================

const CHAPTER_FOOTNOTE_COUNT: Record<string, number> = {
    'ch-1': 181,
    // Add other chapters as processed
};

function isFootnote(block: MinerUBlock, chapterId: string): boolean {
    // Only check text blocks (already handled page_footnote types don't need check)
    if (block.type !== 'text') return false;

    // Ensure it's body text (level 0), not a heading
    // (MinerU sometimes marks headings as level 0 if small, but usually headings have level > 0)
    if ((block as MinerUTextBlock).text_level > 0) return false;

    const text = block.text?.trim() || '';
    const maxFootnote = CHAPTER_FOOTNOTE_COUNT[chapterId] || 0;

    // Match: starts with number 1-maxFootnote, then space
    // e.g. "1 Some text" or "143 Ibid."
    const match = text.match(/^(\d+)\s+/);
    if (!match) return false;

    const num = parseInt(match[1]);
    return num >= 1 && num <= maxFootnote;
}

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

        // HARDCODED FOOTNOTE DETECTION
        // Identify blocks that look like footnotes based on chapter rules
        const chapterId = `ch-${chapterNum}`;
        let recoveredCount = 0;

        for (const block of minerUBlocks) {
            if (isFootnote(block, chapterId)) {
                // Must cast to allow changing type property strictly
                (block as any).type = 'page_footnote';
                recoveredCount++;
            }
        }

        if (recoveredCount > 0) {
            console.log(`[MinerU] Detected/Converted ${recoveredCount} hardcoded footnotes in content body`);
        }

        // Also load footnotes from middle.json (they're in discarded_blocks)
        const footnotes = await loadFootnotesFromMiddleJson(chapterNum, basePath);

        // Combine all blocks (content + footnotes)
        const allBlocks = [...minerUBlocks, ...footnotes];

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
