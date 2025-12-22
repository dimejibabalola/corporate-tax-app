/**
 * Content Parser Service
 * 
 * Parses raw chunk text into structured ContentBlocks
 */

import {
    ContentBlock,
    FormattedContent,
    Reference,
    CheckPrompt
} from '@/types/reader';
import { Chunk, Section } from '@/lib/db';
import { cleanExtractedText, CleanedPage, Footnote } from './text-cleaner';

// ============================================================================
// SLUGIFY
// ============================================================================

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);
}

// ============================================================================
// TEXT PROCESSING
// ============================================================================

/**
 * Format a paragraph with semantic markup
 */
function formatParagraph(text: string): string {
    let html = text.trim();

    // Markup statutory references: § 351 → <span class="statute-ref">§ 351</span>
    html = html.replace(
        /(?:IRC\s*)?(?:§|Section)\s*(\d+[A-Za-z]?(?:\([a-z0-9]+\))?)/gi,
        '<span class="statute-ref" data-section="$1">§ $1</span>'
    );

    // Markup case references: Name v. Commissioner
    html = html.replace(
        /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*[a-z]*)?)\s+v\.\s+(Commissioner|United States|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
        '<span class="case-ref">$1 v. $2</span>'
    );

    // Markup Treasury Regulations: Treas. Reg. § 1.351-1
    html = html.replace(
        /Treas(?:ury)?\.?\s*Reg(?:ulation)?s?\.?\s*§?\s*([\d.-]+)/gi,
        '<span class="reg-ref">Treas. Reg. § $1</span>'
    );

    // Emphasis on key terms (quoted definitions)
    html = html.replace(
        /"([^"]+)"/g,
        '<em class="term">"$1"</em>'
    );

    return html;
}

// ============================================================================
// BLOCK DETECTION
// ============================================================================

/**
 * Parse structural elements from text
 */
export function parseStructuralElements(text: string, sectionLetter?: string): ContentBlock[] {
    const blocks: ContentBlock[] = [];

    // Split into paragraphs
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

    for (const para of paragraphs) {
        const trimmed = para.trim();

        // Detect subsection headers: "1. Control Immediately After"
        if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
            blocks.push({
                type: 'heading',
                level: 3,
                text: trimmed,
                anchor: slugify(trimmed)
            });
        }
        // Detect sub-subsection: "a. Check-the-Box Regulations"
        else if (/^[a-z]\.\s+[A-Z]/.test(trimmed) && trimmed.length < 100) {
            blocks.push({
                type: 'heading',
                level: 4,
                text: trimmed,
                anchor: slugify(trimmed)
            });
        }
        // Detect case header: "Peracchi v. Commissioner" or similar
        else if (/^[A-Z][a-z]+.*\s+v\.\s+(Commissioner|United States|[A-Z])/.test(trimmed) && trimmed.length < 100) {
            blocks.push({
                type: 'case_header',
                name: trimmed,
                page: 0
            });
        }
        // Detect Revenue Ruling header
        else if (/^Rev(?:enue)?\.?\s*Rul(?:ing)?\.?\s*\d{2,4}-\d+/i.test(trimmed)) {
            const match = trimmed.match(/(\d{2,4}-\d+)/);
            blocks.push({
                type: 'ruling_header',
                number: match ? match[1] : '',
                page: 0
            });
        }
        // Detect Problem section
        else if (/^Problem/i.test(trimmed)) {
            const numMatch = trimmed.match(/Problem\s*(\d+)?/i);
            blocks.push({
                type: 'problem',
                number: numMatch?.[1] ? parseInt(numMatch[1]) : undefined,
                content: trimmed
            });
        }
        // Detect Note section
        else if (/^Note\.?$/i.test(trimmed.split('\n')[0]?.trim() || '')) {
            blocks.push({
                type: 'note',
                content: trimmed
            });
        }
        // Detect statutory quotes (indented IRC text)
        else if (/^\s{4,}§?\s*\d+/.test(para) || /^\([a-z]\)\s+/.test(trimmed)) {
            const sectionMatch = trimmed.match(/§?\s*(\d+[A-Za-z]?)/);
            blocks.push({
                type: 'statute_block',
                section: sectionMatch ? sectionMatch[1] : '',
                text: trimmed
            });
        }
        // Detect blockquote (usually indented or starts with specific markers)
        else if (/^["\"']/.test(trimmed) || /^>\s/.test(trimmed)) {
            const content = trimmed.replace(/^["\"'>]\s*/, '').replace(/["\"']$/, '');
            blocks.push({
                type: 'blockquote',
                content
            });
        }
        // Regular paragraph
        else if (trimmed.length > 0) {
            blocks.push({
                type: 'paragraph',
                html: formatParagraph(trimmed)
            });
        }
    }

    return blocks;
}

// ============================================================================
// REFERENCE EXTRACTION
// ============================================================================

/**
 * Extract all references from content
 */
export function extractReferences(text: string): Reference[] {
    const refs: Reference[] = [];
    const seen = new Set<string>();

    // IRC sections: § 351, Section 351, IRC § 351
    const statutes = text.matchAll(/(?:IRC\s*)?(?:§|Section)\s*(\d+[A-Za-z]?(?:\([a-z0-9]+\))?)/gi);
    for (const match of statutes) {
        const key = `statute:${match[1]}`;
        if (!seen.has(key)) {
            refs.push({ type: 'statute', section: match[1] });
            seen.add(key);
        }
    }

    // Cases: Name v. Name/Commissioner/United States
    const cases = text.matchAll(/([A-Z][a-z]+(?:\s+[A-Z]\.?\s*[a-z]*)?)\s+v\.\s+(Commissioner|United States|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g);
    for (const match of cases) {
        const key = `case:${match[0]}`;
        if (!seen.has(key)) {
            refs.push({ type: 'case', name: match[0] });
            seen.add(key);
        }
    }

    // Revenue Rulings
    const rulings = text.matchAll(/Rev(?:enue)?\.?\s*Rul(?:ing)?\.?\s*(\d{2,4}-\d+)/gi);
    for (const match of rulings) {
        const key = `ruling:${match[1]}`;
        if (!seen.has(key)) {
            refs.push({ type: 'ruling', number: match[1] });
            seen.add(key);
        }
    }

    // Treasury Regulations
    const regs = text.matchAll(/Treas(?:ury)?\.?\s*Reg(?:ulation)?s?\.?\s*§?\s*([\d.-]+)/gi);
    for (const match of regs) {
        const key = `reg:${match[1]}`;
        if (!seen.has(key)) {
            refs.push({ type: 'regulation', section: match[1] });
            seen.add(key);
        }
    }

    return refs;
}

// ============================================================================
// MAIN PARSING FUNCTION
// ============================================================================

/**
 * Format section content from chunks into structured FormattedContent
 */
export function formatSectionContent(
    chunks: Chunk[],
    sectionId: string,
    chapterId: string,
    sectionTitle: string,
    sectionLetter?: string
): FormattedContent & { footnotes: Footnote[] } {
    let blocks: ContentBlock[] = [];

    // 1. Add section heading
    blocks.push({
        type: 'heading',
        level: 2,
        text: sectionLetter ? `${sectionLetter}. ${sectionTitle}` : sectionTitle,
        anchor: slugify(sectionTitle)
    });

    // 2. Clean and combine chunk content
    const cleanedPages = chunks.map((c, i) =>
        cleanExtractedText(c.content, c.pageNumbers[0] || i)
    );

    // Combine cleaned text
    const raw = cleanedPages.map(p => p.mainText).join('\n\n');

    // Collect all footnotes
    const allFootnotes = cleanedPages.flatMap(p => p.footnotes);

    // 3. Parse structural elements
    blocks = blocks.concat(parseStructuralElements(raw, sectionLetter));

    // 4. Extract references
    const references = extractReferences(raw);

    // 5. Get page numbers
    const pageNumbers = [...new Set(chunks.flatMap(c => c.pageNumbers))].sort((a, b) => a - b);

    return {
        sectionId,
        chapterId,
        title: sectionTitle,
        blocks,
        pageNumbers,
        references,
        footnotes: allFootnotes
    };
}

// ============================================================================
// DEMO CHECK PROMPTS
// ============================================================================

export const DEMO_CHECK_PROMPTS: Record<string, CheckPrompt[]> = {
    'ch-2-A': [
        {
            id: 'cp-2a-1',
            sectionId: 'ch-2-A',
            afterParagraph: 2,
            prompt: 'What are the THREE requirements for § 351 nonrecognition?',
            hint: 'Think about what must be transferred, what must be received, and what must exist immediately after.',
            answer: '1. Transfer of "property" to a corporation\n2. "Solely" in exchange for "stock"\n3. Transferors in "control" (80%) immediately after'
        },
        {
            id: 'cp-2a-2',
            sectionId: 'ch-2-A',
            prompt: 'What percentage of voting power satisfies "control" under § 368(c)?',
            answer: '80% of the total combined voting power AND 80% of each class of nonvoting stock.'
        }
    ],
    'ch-2-B': [
        {
            id: 'cp-2b-1',
            sectionId: 'ch-2-B',
            prompt: 'Can services qualify as "property" for purposes of § 351?',
            answer: 'No. IRC § 351(d)(1) explicitly excludes services from the definition of property. Stock issued for services is taxable compensation.'
        }
    ],
    'ch-4-A': [
        {
            id: 'cp-4a-1',
            sectionId: 'ch-4-A',
            prompt: 'What is the ordering rule for distributions with respect to E&P?',
            answer: '1. Dividend (to extent of current and accumulated E&P)\n2. Return of capital (reduces stock basis)\n3. Capital gain (excess over basis)'
        }
    ],
    'ch-5-C': [
        {
            id: 'cp-5c-1',
            sectionId: 'ch-5-C',
            prompt: 'What two tests must be met for a "substantially disproportionate" redemption?',
            answer: '1. Shareholder must own less than 50% of voting power after redemption\n2. Shareholder\'s ownership percentage must be less than 80% of pre-redemption percentage'
        }
    ]
};

/**
 * Get check prompts for a section
 */
export function getCheckPromptsForSection(sectionId: string): CheckPrompt[] {
    return DEMO_CHECK_PROMPTS[sectionId] || [];
}