import { v4 as uuidv4 } from 'uuid';

export interface ParsedChapter {
  number: number;
  title: string;
  startPage: number;
  endPage: number;
}

export interface ParsedSection {
  type: 'section' | 'subsection' | 'subsubsection';
  label: string;     // "A", "1", "a"
  title: string;
  startPage: number;
  endPage: number;
}

// ------------------------------------------------------------------
// Page Marker Tracking
// ------------------------------------------------------------------

const PAGE_MARKER_PATTERN = /^---\s*Page\s+(\d+)\s*---$/i;

// PDF page 73 = Book page 3 (Chapter 1 starts on book page 3)
// Offset: PDF_PAGE - 70 = BOOK_PAGE
const PDF_PAGE_OFFSET = 70;

// Content only starts after page 70 (skip front matter, preface, TOC)
const MIN_CONTENT_PAGE = 71;

/**
 * Build a map of line index -> book page number from the text
 * Converts PDF pages to book pages using offset
 */
function buildPageMap(lines: string[]): Map<number, number> {
  const pageMap = new Map<number, number>();
  let currentPdfPage = 1;

  lines.forEach((line, index) => {
    const match = line.trim().match(PAGE_MARKER_PATTERN);
    if (match) {
      currentPdfPage = parseInt(match[1]);
    }
    // Convert PDF page to book page (ensure minimum of 1)
    const bookPage = Math.max(1, currentPdfPage - PDF_PAGE_OFFSET);
    pageMap.set(index, bookPage);
  });

  return pageMap;
}

/**
 * Get raw PDF page from line index
 */
function getPdfPage(lines: string[], index: number): number {
  let currentPage = 1;
  for (let i = 0; i <= index; i++) {
    const match = lines[i].trim().match(PAGE_MARKER_PATTERN);
    if (match) {
      currentPage = parseInt(match[1]);
    }
  }
  return currentPage;
}

// ------------------------------------------------------------------
// Stage 1: Chapter Detection (handles OCR'd text with extra spaces)
// ------------------------------------------------------------------

// Pattern for chapters in fundamentals.txt (handles extra OCR spaces)
const CHAPTER_PATTERN = /CHAPTER\s+(\d+)\s+([A-Z][A-Z\s,&\-]+)/i;

export function detectStructureFromText(text: string): { chapters: ParsedChapter[] } {
  const lines = text.split('\n');
  const pageMap = buildPageMap(lines);
  const chapters: ParsedChapter[] = [];

  lines.forEach((line, index) => {
    const cleanLine = line.trim().replace(/\s+/g, ' ');
    if (!cleanLine) return;

    // Skip front matter (preface, TOC, etc.)
    const pdfPage = getPdfPage(lines, index);
    if (pdfPage < MIN_CONTENT_PAGE) return;

    // Skip TOC pages that list multiple chapters (e.g., "CHAPTER 2 ... CHAPTER 3 ... CHAPTER 4")
    const chapterMentions = (cleanLine.match(/CHAPTER\s+\d+/gi) || []).length;
    if (chapterMentions > 1) return;

    const match = cleanLine.match(CHAPTER_PATTERN);
    if (match) {
      const chapterNum = parseInt(match[1]);
      // Skip if we already have this chapter number (duplicate header)
      if (chapters.some(c => c.number === chapterNum)) return;

      // Clean up title
      let title = match[2].trim();
      const sectionMarker = title.search(/\s+[A-H]\.\s+[A-Z]/);
      if (sectionMarker > 10) {
        title = title.substring(0, sectionMarker).trim();
      }

      chapters.push({
        number: chapterNum,
        title: title.replace(/\s+/g, ' '),
        startPage: pageMap.get(index) || 1,
        endPage: pageMap.get(index) || 1
      });
    }
  });

  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: "Full Text",
      startPage: 1,
      endPage: Math.max(...Array.from(pageMap.values()))
    });
  } else {
    // Sort by page number and fix end pages
    chapters.sort((a, b) => a.startPage - b.startPage);
    for (let i = 0; i < chapters.length; i++) {
      chapters[i].endPage = chapters[i + 1]
        ? chapters[i + 1].startPage - 1
        : Math.max(...Array.from(pageMap.values()));
    }
  }

  return { chapters };
}

// ------------------------------------------------------------------
// Stage 1.5: Section Detection within Chapters
// ------------------------------------------------------------------

const SECTION_PATTERNS: { pattern: RegExp; type: ParsedSection['type'] }[] = [
  { pattern: /\b([A-H])\.\s+([A-Z][A-Z\s,&\-'"()]+)/, type: 'section' },
  { pattern: /\b(\d)\.\s+([A-Z][A-Z\s,&\-'"()]+)/, type: 'subsection' },
  { pattern: /\b([a-h])\.\s+"([^"]+)"/, type: 'subsubsection' },
];

export function detectSectionsFromText(
  text: string,
  chapterStartPage: number,
  chapterEndPage: number
): ParsedSection[] {
  const lines = text.split('\n');
  const pageMap = buildPageMap(lines);
  const sections: ParsedSection[] = [];

  lines.forEach((line, index) => {
    const currentPage = pageMap.get(index) || 1;
    // Only process lines within our chapter's page range
    if (currentPage < chapterStartPage || currentPage > chapterEndPage) return;

    const cleanLine = line.trim().replace(/\s+/g, ' ');
    if (!cleanLine || cleanLine.length < 15) return;

    for (const { pattern, type } of SECTION_PATTERNS) {
      const match = cleanLine.match(pattern);
      if (match) {
        const label = match[1];
        let title = match[2].trim().replace(/\s+/g, ' ');

        if (title.length > 60) {
          const boundary = title.substring(0, 60).lastIndexOf(' ');
          title = title.substring(0, boundary > 30 ? boundary : 60);
        }

        // Deduplicate (same label+type on same page)
        const lastSection = sections[sections.length - 1];
        if (lastSection && lastSection.label === label && lastSection.type === type) {
          break;
        }

        sections.push({
          type,
          label,
          title,
          startPage: currentPage,
          endPage: currentPage
        });
        break;
      }
    }
  });

  // Fix end pages
  for (let i = 0; i < sections.length; i++) {
    sections[i].endPage = sections[i + 1]
      ? sections[i + 1].startPage
      : chapterEndPage;
  }

  return sections;
}

/**
 * Detects both chapters and their sections from text.
 */
export function detectFullStructure(text: string): {
  chapters: ParsedChapter[];
  sectionsByChapter: Map<number, ParsedSection[]>;
} {
  const { chapters } = detectStructureFromText(text);
  const sectionsByChapter = new Map<number, ParsedSection[]>();

  chapters.forEach(chapter => {
    const sections = detectSectionsFromText(text, chapter.startPage, chapter.endPage);
    sectionsByChapter.set(chapter.number, sections);
  });

  return { chapters, sectionsByChapter };
}


// ------------------------------------------------------------------
// Stage 2: Entity Extraction (Cases & Statutes)
// ------------------------------------------------------------------

function extractCaseRefs(text: string): string[] {
  const caseRegex = /([A-Z][\w\.,]+(?:\s+[A-Z][\w\.,]+)*\s+v\.\s+[A-Z][\w\.,]+(?:\s+[A-Z][\w\.,]+)*)/g;
  const refs = text.match(caseRegex);
  return refs ? Array.from(new Set(refs)) : [];
}

function extractStatutoryRefs(text: string): string[] {
  const statuteRegex = /((?:IRC\s+|Section\s+|Sec\.\s+)?§\s*\d+[A-Za-z0-9\(\)]*)/g;
  const refs = text.match(statuteRegex);
  return refs ? Array.from(new Set(refs)) : [];
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

// ------------------------------------------------------------------
// Stage 3: Granular Chunking (respects paragraphs)
// ------------------------------------------------------------------

export function generateChunksFromText(text: string, chapters: any[], textbookId: string) {
  const lines = text.split('\n');
  const pageMap = buildPageMap(lines);
  const chunks: any[] = [];
  let sequence = 0;

  const MIN_TOKENS = 50;
  const MAX_TOKENS = 400;

  chapters.forEach(chapter => {
    // Filter lines by page range
    const chapterLines = lines.filter((_, idx) => {
      const page = pageMap.get(idx) || 1;
      return page >= chapter.startPage && page <= chapter.endPage;
    });
    const chapterText = chapterLines.join('\n');
    const paragraphs = chapterText.split(/\n\s*\n/);

    let buffer: string[] = [];
    let bufferTokens = 0;

    const commitBuffer = () => {
      if (buffer.length === 0) return;

      const content = buffer.join('\n\n');
      chunks.push({
        id: uuidv4(),
        textbookId,
        chapterId: chapter.id,
        content,
        pageNumbers: [],
        tokenCount: bufferTokens,
        statutoryRefs: extractStatutoryRefs(content),
        caseRefs: extractCaseRefs(content),
        sequenceOrder: sequence++
      });
      buffer = [];
      bufferTokens = 0;
    };

    for (const para of paragraphs) {
      if (!para.trim()) continue;

      const paraTokens = estimateTokens(para);

      if (bufferTokens + paraTokens > MAX_TOKENS) {
        commitBuffer();
      }

      buffer.push(para);
      bufferTokens += paraTokens;

      if (bufferTokens >= MIN_TOKENS) {
        commitBuffer();
      }
    }

    commitBuffer();
  });

  return chunks;
}

// ------------------------------------------------------------------
// Stage 5: Verbatim Page Extraction for Chapter Reader
// ------------------------------------------------------------------

export interface ChapterPage {
  pageNumber: number;  // Book page number
  content: string;     // Raw page text (verbatim)
}

/**
 * Extract verbatim page content for a chapter
 * Returns pages exactly as they appear in the text with book page numbers
 */
export function extractChapterPages(text: string, startPage: number, endPage: number): ChapterPage[] {
  const lines = text.split('\n');
  const pages: ChapterPage[] = [];

  let currentPdfPage = 1;
  let currentContent: string[] = [];
  let inRange = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.trim().match(PAGE_MARKER_PATTERN);

    if (match) {
      // Save previous page if we were in range
      if (inRange && currentContent.length > 0) {
        const bookPage = Math.max(1, currentPdfPage - PDF_PAGE_OFFSET);
        pages.push({
          pageNumber: bookPage,
          content: currentContent.join('\n').trim()
        });
        currentContent = [];
      }

      currentPdfPage = parseInt(match[1]);
      const bookPage = Math.max(1, currentPdfPage - PDF_PAGE_OFFSET);

      // Check if we're in the chapter range
      if (bookPage >= startPage && bookPage <= endPage) {
        inRange = true;
      } else if (bookPage > endPage) {
        // Past the chapter, stop
        break;
      } else {
        inRange = false;
      }
    } else if (inRange) {
      // Don't skip the page marker line itself - add content
      currentContent.push(line);
    }
  }

  // Save the last page if we were in range
  if (inRange && currentContent.length > 0) {
    const bookPage = Math.max(1, currentPdfPage - PDF_PAGE_OFFSET);
    pages.push({
      pageNumber: bookPage,
      content: currentContent.join('\n').trim()
    });
  }

  return pages;
}