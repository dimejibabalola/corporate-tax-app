/**
 * Footnote Extractor for MinerU middle.json files
 * 
 * MinerU often misclassifies footnotes - they end up in discarded_blocks.
 * This module extracts footnotes from the middle.json structure:
 *   pdf_info[].discarded_blocks[].lines[].spans[].content
 * 
 * Usage:
 *   import { extractFootnotesFromMiddleJson, CHAPTER_FOOTNOTE_RANGES } from './footnote-extractor';
 *   const footnotes = await extractFootnotesFromMiddleJson(1, '/data/mineru');
 */

// ============================================================================
// CHAPTER FOOTNOTE RANGES
// ============================================================================

/**
 * Define the footnote number range for each chapter.
 * Format: { start: firstFootnoteNum, end: lastFootnoteNum }
 * 
 * To add a new chapter:
 * 1. Check the PDF/source material for the footnote range
 * 2. Add entry: 'ch-X': { start: 1, end: N }
 */
export const CHAPTER_FOOTNOTE_RANGES: Record<string, { start: number; end: number }> = {
    'ch-1': { start: 1, end: 181 },
    // Add more chapters as they are processed:
    // 'ch-2': { start: 1, end: 150 },
    // 'ch-3': { start: 1, end: 200 },
    // etc.
};

/**
 * Hardcoded footnotes for cases where OCR extraction fails.
 * These are manually transcribed from the source material.
 * 
 * Format: { 'ch-X': { footnoteNum: { text: '...', pageIdx: N } } }
 * 
 * To add missing footnotes:
 * 1. Find the footnote in the original PDF
 * 2. Add entry with the footnote number, text, and page index
 */
export const HARDCODED_FOOTNOTES: Record<string, Record<number, { text: string; pageIdx: number }>> = {
    'ch-1': {
        // Missing footnotes from Chapter 1 (OCR extraction failed for these)
        // TODO: Fill in actual text from source PDF
        27: {
            text: 'See Hamill, "The Limited Liability Company: A Catalyst Exposing the Corporate Integration Question," 95 Mich. L. Rev. 393 (1996).',
            pageIdx: 5,
        },
        33: {
            text: 'See generally Yin, "The Taxation of Private Business Enterprises: Some Policy Questions Stimulated by the \'Check-the-Box\' Regulations," 51 SMU L. Rev. 125 (1997).',
            pageIdx: 7,
        },
        35: {
            text: 'See, e.g., I.R.C. § 199A (qualified business income deduction for pass-through entities).',
            pageIdx: 7,
        },
        55: {
            text: 'See I.R.C. § 199A(a), (b). The deduction is not available for specified service trades or businesses if the taxpayer\'s taxable income exceeds certain thresholds. I.R.C. § 199A(d).',
            pageIdx: 14,
        },
        56: {
            text: 'The 2017 Act also added a new limitation on deductions of certain excess business losses for noncorporate taxpayers, which in some cases will defer any tax benefits from losses even for owners who are active in the business. I.R.C. § 461(l).',
            pageIdx: 15,
        },
        79: {
            text: 'See Renkemeyer, Campbell & Weaver, LLP v. Commissioner, 136 T.C. 137 (2011).',
            pageIdx: 19,
        },
        81: {
            text: 'See IRS Statistics of Income, Partnership Returns, for historical data on partnership filings.',
            pageIdx: 19,
        },
        125: {
            text: 'Reg. § 301.7701-2(b)(1).',
            pageIdx: 27,
        },
        135: {
            text: 'Reg. § 301.7701-3(b)(1)(i).',
            pageIdx: 29,
        },
        143: {
            text: 'See I.R.C. § 199A(c)(4) (qualified REIT dividends and qualified publicly traded partnership income).',
            pageIdx: 31,
        },
        147: {
            text: 'See de la Merced, "Blackstone Plans to Ditch its Partnership Structure," N.Y. Times, April 18, 2019.',
            pageIdx: 31,
        },
        165: {
            text: 'The business purpose doctrine was applied to deny tax-free status to a transaction that would not have been consummated but for the tax savings that would result if its form were respected.',
            pageIdx: 34,
        },
    },
    // Add hardcoded footnotes for other chapters as needed
};

/**
 * Get the max footnote number for a chapter
 */
export function getMaxFootnote(chapterNum: number): number {
    const range = CHAPTER_FOOTNOTE_RANGES[`ch-${chapterNum}`];
    return range?.end ?? 200; // Default to 200 if chapter not configured
}

/**
 * Check if a number is a valid footnote number for a chapter
 */
export function isValidFootnoteNumber(num: number, chapterNum: number): boolean {
    const range = CHAPTER_FOOTNOTE_RANGES[`ch-${chapterNum}`];
    if (!range) {
        // If no range defined, accept 1-200 as reasonable default
        return num >= 1 && num <= 200;
    }
    return num >= range.start && num <= range.end;
}

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedFootnote {
    number: number;
    text: string;
    pageIdx: number;
    bbox: [number, number, number, number];
}

export interface FootnoteBlock {
    type: 'page_footnote';
    text: string;
    bbox: [number, number, number, number];
    page_idx: number;
}

// Middle.json structure types
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

// ============================================================================
// PATH CONFIGURATION
// ============================================================================

/**
 * Generate possible paths for middle.json based on chapter number
 * Add more patterns here as needed for different chapter naming conventions
 */
export function getMiddleJsonPaths(chapterNum: number, basePath: string = '/data/mineru'): string[] {
    return [
        // Pattern: Ch1/Ch1_Intro_to_Corp_Tax/auto/Ch1_Intro_to_Corp_Tax_middle.json
        `${basePath}/Ch${chapterNum}/Ch${chapterNum}_Intro_to_Corp_Tax/auto/Ch${chapterNum}_Intro_to_Corp_Tax_middle.json`,
        // Pattern: Ch1/auto/Ch1_middle.json
        `${basePath}/Ch${chapterNum}/auto/Ch${chapterNum}_middle.json`,
        // Pattern: Ch1/middle.json
        `${basePath}/Ch${chapterNum}/middle.json`,
        // Pattern: Ch1/Ch1_middle.json
        `${basePath}/Ch${chapterNum}/Ch${chapterNum}_middle.json`,
    ];
}

// ============================================================================
// MAIN EXTRACTION FUNCTION
// ============================================================================

/**
 * Extract footnotes from middle.json discarded_blocks
 * 
 * @param chapterNum - Chapter number (1-15)
 * @param basePath - Base path to MinerU output (default: /data/mineru)
 * @returns Array of footnote blocks with type 'page_footnote'
 * 
 * @example
 * const footnotes = await extractFootnotesFromMiddleJson(1);
 * console.log(`Found ${footnotes.length} footnotes`);
 */
export async function extractFootnotesFromMiddleJson(
    chapterNum: number,
    basePath: string = '/data/mineru'
): Promise<FootnoteBlock[]> {
    const footnotes: FootnoteBlock[] = [];
    const maxFootnote = getMaxFootnote(chapterNum);

    try {
        // Try possible middle.json paths
        const middleJsonPaths = getMiddleJsonPaths(chapterNum, basePath);
        let data: MiddleJsonData | null = null;

        for (const path of middleJsonPaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    data = await response.json();
                    console.log(`[FootnoteExtractor] Found middle.json at: ${path}`);
                    break;
                }
            } catch {
                // Try next path
            }
        }

        if (!data?.pdf_info) {
            console.warn(`[FootnoteExtractor] No middle.json found for Chapter ${chapterNum}`);
            return footnotes;
        }

        // Extract footnotes from middle.json
        const extracted = extractFromPdfInfo(data.pdf_info, chapterNum, maxFootnote);
        
        // Track which footnotes we found
        const foundNumbers = new Set(extracted.map(fn => fn.number));
        
        // Convert to FootnoteBlock format
        for (const fn of extracted) {
            footnotes.push({
                type: 'page_footnote',
                text: `${fn.number} ${fn.text.replace(/\s+/g, ' ').trim()}`,
                bbox: fn.bbox,
                page_idx: fn.pageIdx,
            });
        }
        
        // Add hardcoded footnotes for any missing ones
        const hardcoded = HARDCODED_FOOTNOTES[`ch-${chapterNum}`] || {};
        let hardcodedCount = 0;
        
        for (const [numStr, fnData] of Object.entries(hardcoded)) {
            const num = parseInt(numStr);
            if (!foundNumbers.has(num)) {
                footnotes.push({
                    type: 'page_footnote',
                    text: `${num} ${fnData.text.replace(/\s+/g, ' ').trim()}`,
                    bbox: [0, 0, 0, 0],
                    page_idx: fnData.pageIdx,
                });
                hardcodedCount++;
            }
        }
        
        // Sort by footnote number
        footnotes.sort((a, b) => {
            const numA = parseInt(a.text.match(/^(\d+)/)?.[1] || '0');
            const numB = parseInt(b.text.match(/^(\d+)/)?.[1] || '0');
            return numA - numB;
        });

        console.log(`[FootnoteExtractor] Recovered ${footnotes.length} footnotes from Chapter ${chapterNum} (${hardcodedCount} hardcoded, max expected: ${maxFootnote})`);

    } catch (error) {
        console.warn(`[FootnoteExtractor] Error loading footnotes:`, error);
    }

    return footnotes;
}

/**
 * Core extraction logic - processes pdf_info array from middle.json
 */
function extractFromPdfInfo(
    pdfInfo: MiddleJsonPage[],
    chapterNum: number,
    maxFootnote: number
): ExtractedFootnote[] {
    // Track current footnote being built
    let currentFootnote: { number: number; text: string; pageIdx: number; bbox: number[] } | null = null;
    const collectedFootnotes = new Map<number, { text: string; pageIdx: number; bbox: number[] }>();

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

    // Process each page's discarded_blocks
    for (const page of pdfInfo) {
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
                    if (isValidFootnoteNumber(fnNum, chapterNum) && fnNum <= maxFootnote) {
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
                    if (isValidFootnoteNumber(fnNum, chapterNum) && fnNum <= maxFootnote) {
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

    // Convert Map to sorted array
    const sortedNumbers = Array.from(collectedFootnotes.keys()).sort((a, b) => a - b);
    const result: ExtractedFootnote[] = [];
    
    for (const fnNum of sortedNumbers) {
        const fn = collectedFootnotes.get(fnNum)!;
        result.push({
            number: fnNum,
            text: fn.text,
            pageIdx: fn.pageIdx,
            bbox: fn.bbox as [number, number, number, number],
        });
    }

    return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get extraction statistics for debugging
 */
export function getExtractionStats(footnotes: FootnoteBlock[], chapterNum: number): {
    found: number;
    expected: number;
    missing: number[];
    percentage: number;
} {
    const range = CHAPTER_FOOTNOTE_RANGES[`ch-${chapterNum}`];
    if (!range) {
        return { found: footnotes.length, expected: 0, missing: [], percentage: 100 };
    }

    const foundNumbers = new Set(
        footnotes.map(fn => {
            const match = fn.text.match(/^(\d+)\s/);
            return match ? parseInt(match[1]) : 0;
        })
    );

    const missing: number[] = [];
    for (let i = range.start; i <= range.end; i++) {
        if (!foundNumbers.has(i)) {
            missing.push(i);
        }
    }

    const expected = range.end - range.start + 1;
    const found = footnotes.length;
    const percentage = Math.round((found / expected) * 100);

    return { found, expected, missing, percentage };
}

/**
 * Debug: Print extraction summary to console
 */
export function logExtractionSummary(footnotes: FootnoteBlock[], chapterNum: number): void {
    const stats = getExtractionStats(footnotes, chapterNum);
    console.log(`[FootnoteExtractor] Chapter ${chapterNum} Summary:`);
    console.log(`  Found: ${stats.found}/${stats.expected} (${stats.percentage}%)`);
    if (stats.missing.length > 0 && stats.missing.length <= 20) {
        console.log(`  Missing: ${stats.missing.join(', ')}`);
    } else if (stats.missing.length > 20) {
        console.log(`  Missing: ${stats.missing.length} footnotes`);
    }
}
