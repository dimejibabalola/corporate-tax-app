/**
 * Text Cleaner Service
 * 
 * Cleans extracted text from legal textbooks:
 * - Removes page headers and numbers
 * - Extracts footnotes
 * - Fixes OCR errors
 * - Restores paragraph breaks
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CleanedPage {
    pageNumber: number;
    mainText: string;
    footnotes: Footnote[];
    headerText?: string;
}

export interface Footnote {
    number: number;
    text: string;
}

export interface PageBoundary {
    pageNumber: number;
    chapterRef?: string;
    sectionContext?: string;
    startIndex: number;
    endIndex: number;
}

export interface ReaderPage {
    pageNumber: number;
    chapterId: string;
    sectionId: string;
    sectionTitle: string;
    content: string;
    footnotes: Footnote[];
    isPageStart: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// MAIN CLEANING FUNCTION
// ============================================================================

/**
 * Clean extracted text from a single page
 */
export function cleanExtractedText(rawText: string, pageNumber: number): CleanedPage {
    let cleaned = rawText;
    let headerText: string | undefined;

    // 1. DETECT AND REMOVE PAGE HEADERS
    const headerPatterns = [
        /^(AN OVERVIEW OF THE TAXATION OF CORPORATIONS|CHAPTER \d+|PART (ONE|TWO|THREE)|AND SHAREHOLDERS)/gm,
        /^\d+\s+(INTRODUCTION|PART \d+|TAXATION OF)/gm,
        /(INTRODUCTION|TAXATION OF C CORPORATIONS|TAXATION OF S CORPORATIONS)\s+PART (ONE|TWO|THREE)\s*$/gm,
    ];

    for (const pattern of headerPatterns) {
        const match = cleaned.match(pattern);
        if (match) {
            headerText = headerText || match[0].trim();
            cleaned = cleaned.replace(pattern, '');
        }
    }

    // 2. DETECT AND REMOVE STANDALONE PAGE NUMBERS
    // Arabic numerals at start of line
    cleaned = cleaned.replace(/^\s*\d{1,3}\s*$/gm, '');
    // Roman numerals
    cleaned = cleaned.replace(/^\s*[xivlc]+\s*$/gmi, '');
    // Page numbers at end of content block
    cleaned = cleaned.replace(/\n\s*\d{1,3}\s*$/g, '');

    // 3. EXTRACT FOOTNOTES
    const footnotes: Footnote[] = [];

    // Pattern: line starting with 1-2 digit number followed by legal citation patterns
    const footnotePattern = /^(\d{1,2})\s+(See,?\s+e\.g\.,?|I\.R\.C\.|See\s+generally|See\s+Chapter|Pub\.\s+L\.|Rev\.\s+Rul\.|Treas\.\s+Reg\.|Compare|Note\s+that|For\s+a\s+discussion)/gm;

    let fnMatch;
    const fnPositions: { number: number; start: number; text: string }[] = [];

    while ((fnMatch = footnotePattern.exec(cleaned)) !== null) {
        const fnNumber = parseInt(fnMatch[1]);
        fnPositions.push({
            number: fnNumber,
            start: fnMatch.index,
            text: '' // Will be filled in next step
        });
    }

    // Extract full footnote text (from start to next footnote or end)
    for (let i = 0; i < fnPositions.length; i++) {
        const start = fnPositions[i].start;
        const end = i + 1 < fnPositions.length
            ? fnPositions[i + 1].start
            : cleaned.length;

        const fnFullText = cleaned.slice(start, end).trim();
        const fnText = fnFullText.replace(/^\d{1,2}\s+/, '').trim();

        footnotes.push({
            number: fnPositions[i].number,
            text: fnText
        });
    }

    // Remove footnotes from main text (work backwards to preserve indices)
    for (let i = fnPositions.length - 1; i >= 0; i--) {
        const start = fnPositions[i].start;
        const end = i + 1 < fnPositions.length
            ? fnPositions[i + 1].start
            : undefined;

        if (end) {
            cleaned = cleaned.slice(0, start) + cleaned.slice(end);
        } else {
            cleaned = cleaned.slice(0, start);
        }
    }

    // 4. CLEAN INLINE FOOTNOTE REFERENCES
    // "corporations.6 Congress" → "corporations. Congress"
    cleaned = cleaned.replace(/([.,"'])\s*(\d{1,2})\s+([A-Z])/g, '$1 $3');

    // "word6 Next" → "word Next" (footnote ref after word)
    cleaned = cleaned.replace(/(\w)(\d{1,2})\s+([A-Z])/g, '$1 $3');

    // 5. FIX COMMON OCR/EXTRACTION ERRORS
    // T[.R.C. → I.R.C.
    cleaned = cleaned.replace(/T\[\\.R\\.C\\./g, 'I.R.C.');
    cleaned = cleaned.replace(/=\[LR\\.C\\./g, 'I.R.C.');
    cleaned = cleaned.replace(/LR\\.C\\./g, 'I.R.C.');
    cleaned = cleaned.replace(/I\\.R\\.C\\.\\s*§"statute-ref"[^>]*/g, 'I.R.C. §');

    // Fix common ligature issues
    cleaned = cleaned.replace(/ﬁ/g, 'fi');
    cleaned = cleaned.replace(/ﬂ/g, 'fl');
    cleaned = cleaned.replace(/ﬀ/g, 'ff');

    // Fix broken section symbols
    cleaned = cleaned.replace(/\$\s*(\d+)/g, '§ $1');

    // 6. NORMALIZE WHITESPACE
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 7. RESTORE PARAGRAPH BREAKS
    cleaned = restoreParagraphBreaks(cleaned);

    return {
        pageNumber,
        mainText: cleaned,
        footnotes,
        headerText
    };
}

// ============================================================================
// PARAGRAPH RESTORATION
// ============================================================================

/**
 * Restore paragraph breaks based on structural patterns
 */
export function restoreParagraphBreaks(text: string): string {
    let result = text;

    // Insert breaks before section headers
    const breakPatterns: [RegExp, string][] = [
        // Section letters: "A. Introduction"
        [/\.\s+([A-H]\.\s+[A-Z][a-z]+)/g, '.\n\n$1'],

        // Subsection numbers: "1. The Corporate Tax"
        [/\.\s+(\d+\.\s+[A-Z][a-z]+)/g, '.\n\n$1'],

        // Sub-subsection letters: "a. Check-the-Box"
        [/\.\s+([a-h]\.\s+[A-Z][a-z]+)/g, '.\n\n$1'],

        // Topic headers
        [/\.\s+(The\s+(?:Double|International|Broader|Corporate|Individual|Check))/g, '.\n\n$1'],

        // Paragraph starters
        [/\.\s+(For\s+(?:many|example|much|purposes|instance))/g, '.\n\n$1'],
        [/\.\s+(In\s+(?:some|many|the|response|addition|contrast|general|summary))/g, '.\n\n$1'],
        [/\.\s+(Although|However|Despite|Additionally|Moreover|Furthermore|Thus|Therefore|Consequently)/g, '.\n\n$1'],

        // Problem/Example markers  
        [/\.\s+(Problem\.?)/g, '.\n\n$1'],
        [/\.\s+(Example\.?)/g, '.\n\n$1'],
        [/\.\s+(Note\.?)/g, '.\n\n$1'],
    ];

    for (const [pattern, replacement] of breakPatterns) {
        result = result.replace(pattern, replacement);
    }

    return result;
}