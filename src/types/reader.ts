/**
 * Reader Types
 * 
 * Content block system for structured rendering of textbook content
 */

// ============================================================================
// CONTENT BLOCKS
// ============================================================================

export type ContentBlock =
    | HeadingBlock
    | ParagraphBlock
    | CaseHeaderBlock
    | RulingHeaderBlock
    | ProblemBlock
    | NoteBlock
    | StatuteBlock
    | BlockquoteBlock
    | ListBlock
    | CheckPromptBlock;

export interface HeadingBlock {
    type: 'heading';
    level: 2 | 3 | 4;
    text: string;
    anchor: string;
}

export interface ParagraphBlock {
    type: 'paragraph';
    html: string;
}

export interface CaseHeaderBlock {
    type: 'case_header';
    name: string;
    citation?: string;
    page: number;
}

export interface RulingHeaderBlock {
    type: 'ruling_header';
    number: string;
    page: number;
}

export interface ProblemBlock {
    type: 'problem';
    number?: number;
    content: string;
}

export interface NoteBlock {
    type: 'note';
    content: string;
}

export interface StatuteBlock {
    type: 'statute_block';
    section: string;
    text: string;
}

export interface BlockquoteBlock {
    type: 'blockquote';
    content: string;
    source?: string;
}

export interface ListBlock {
    type: 'list';
    ordered: boolean;
    items: string[];
}

export interface CheckPromptBlock {
    type: 'check_prompt';
    id: string;
    prompt: string;
    hint?: string;
    answer: string;
}

// ============================================================================
// FORMATTED CONTENT
// ============================================================================

export interface FormattedContent {
    sectionId: string;
    chapterId: string;
    title: string;
    blocks: ContentBlock[];
    pageNumbers: number[];
    references: Reference[];
}

// ============================================================================
// REFERENCES
// ============================================================================

export type Reference =
    | { type: 'statute'; section: string; title?: string }
    | { type: 'case'; name: string; citation?: string }
    | { type: 'ruling'; number: string }
    | { type: 'regulation'; section: string }
    | { type: 'internal'; sectionId: string; title: string };

// ============================================================================
// CHECK PROMPTS
// ============================================================================

export interface CheckPrompt {
    id: string;
    sectionId: string;
    afterParagraph?: number;  // Insert after this paragraph index
    prompt: string;
    hint?: string;
    answer: string;
}

// ============================================================================
// READER SECTION
// ============================================================================

export interface ReaderSection {
    id: string;
    sectionId: string;
    chapterId: string;
    title: string;
    content: FormattedContent;
    checkPrompts: CheckPrompt[];
    pageNumbers: number[];
}

// ============================================================================
// CHUNKED READING
// ============================================================================

export interface ChunkedReading {
    chapterId: string;
    chapterTitle: string;
    sections: {
        sectionId: string;
        title: string;
        completed: boolean;
    }[];
    currentIndex: number;
    progress: number;  // 0-100
}

// ============================================================================
// SEARCH
// ============================================================================

export interface SearchResult {
    id: string;
    type: 'content' | 'case' | 'statute' | 'ruling' | 'annotation';
    sectionId: string;
    chapterNumber: number;
    sectionTitle: string;
    pageNumber: number;
    snippet: string;
    matchedText: string;
    relevanceScore: number;
}

export interface SearchQuery {
    query: string;
    filters?: {
        chapters?: number[];
        type?: ('content' | 'case' | 'statute' | 'ruling' | 'annotation')[];
        pageRange?: { start: number; end: number };
    };
    limit?: number;
}