import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';

// Configure worker - in a real prod build this might need specific asset handling
// For Vite, we can often rely on the CDN or a local copy. Using CDN for simplicity in this preview.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export interface ParsedPage {
  pageNumber: number;
  text: string;
}

export interface DetectedStructure {
  chapters: {
    number: number;
    title: string;
    startPage: number;
    endPage: number;
  }[];
}

// ------------------------------------------------------------------
// Stage 1: Extraction
// ------------------------------------------------------------------

export async function extractTextFromPDF(file: File, onProgress?: (current: number, total: number) => void): Promise<ParsedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const pages: ParsedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    
    pages.push({
      pageNumber: i,
      text: cleanText(text)
    });

    if (onProgress) onProgress(i, numPages);
  }

  return pages;
}

// ------------------------------------------------------------------
// Stage 2: Cleaning
// ------------------------------------------------------------------

function cleanText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Fix common legal OCR artifacts
    .replace(/§\s+/g, '§')
    .replace(/\bl\b(?=RC)/g, 'I') // lRC -> IRC
    // Normalize quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

// ------------------------------------------------------------------
// Stage 3: Structure Detection
// ------------------------------------------------------------------

const CHAPTER_PATTERNS = [
  /^Chapter\s+(\d+)[:\s]+(.+)$/i,
  /^CHAPTER\s+(\d+)[:\s]+(.+)$/i,
  /^Part\s+([IVXLC]+)[:\s]+(.+)$/i,
  /^Unit\s+(\d+)[:\s]+(.+)$/i,
  /^(\d+)\.\s+([A-Z][A-Z\s]+)$/ // "1. CORPORATE FORMATIONS"
];

export function detectStructure(pages: ParsedPage[]): DetectedStructure {
  const chapters = [];
  
  for (const page of pages) {
    // Check first 200 chars of page for chapter headings
    const startText = page.text.substring(0, 200);
    
    for (const pattern of CHAPTER_PATTERNS) {
      const match = startText.match(pattern);
      if (match) {
        // Avoid duplicate chapters if header repeats on next page
        const lastChapter = chapters[chapters.length - 1];
        if (lastChapter && lastChapter.number === parseInt(match[1])) continue;

        chapters.push({
          number: chapters.length + 1, // Auto-increment for safety, or use match[1] if reliable
          title: match[2].trim(),
          startPage: page.pageNumber,
          endPage: page.pageNumber // Will update later
        });
        break; 
      }
    }
  }

  // Fallback: If no chapters detected (common in some PDFs), create one big chapter
  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: "Full Text",
      startPage: 1,
      endPage: pages.length
    });
  } else {
    // Fix end pages
    for (let i = 0; i < chapters.length; i++) {
      chapters[i].endPage = chapters[i + 1] ? chapters[i + 1].startPage - 1 : pages.length;
    }
  }

  return { chapters };
}

// ------------------------------------------------------------------
// Stage 4: Chunking
// ------------------------------------------------------------------

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

function extractCaseRefs(text: string): string[] {
    const refs = text.match(/([A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+)/g);
    return refs ? Array.from(new Set(refs)) : [];
}

function extractStatutoryRefs(text: string): string[] {
    const refs = text.match(/(IRC\s*)?§\s*(\d+[A-Za-z]?)/g);
    return refs ? Array.from(new Set(refs)) : [];
}

export function generateChunks(pages: ParsedPage[], chapters: any[], textbookId: string) {
  const chunks: any[] = [];
  let sequence = 0;

  chapters.forEach(chapter => {
    // Get all text for this chapter
    const chapterPages = pages.filter(p => p.pageNumber >= chapter.startPage && p.pageNumber <= chapter.endPage);
    const fullText = chapterPages.map(p => p.text).join('\n\n');
    
    // Split by double newline (paragraphs)
    const paragraphs = fullText.split(/\n\n+/);
    
    let currentChunkText = [];
    let currentTokens = 0;
    const TARGET_TOKENS = 600;
    
    for (const para of paragraphs) {
        const paraTokens = estimateTokens(para);
        
        if (currentTokens + paraTokens > TARGET_TOKENS && currentChunkText.length > 0) {
            // Commit chunk
            const content = currentChunkText.join('\n\n');
            chunks.push({
                id: uuidv4(),
                textbookId,
                chapterId: chapter.id, // Need to ensure chapter has ID before calling this
                content,
                pageNumbers: [], // Simplified for now, ideally map back to source pages
                tokenCount: currentTokens,
                statutoryRefs: extractStatutoryRefs(content),
                caseRefs: extractCaseRefs(content),
                sequenceOrder: sequence++
            });
            currentChunkText = [para];
            currentTokens = paraTokens;
        } else {
            currentChunkText.push(para);
            currentTokens += paraTokens;
        }
    }
    
    // Commit remaining
    if (currentChunkText.length > 0) {
        const content = currentChunkText.join('\n\n');
        chunks.push({
            id: uuidv4(),
            textbookId,
            chapterId: chapter.id,
            content,
            pageNumbers: [],
            tokenCount: currentTokens,
            statutoryRefs: extractStatutoryRefs(content),
            caseRefs: extractCaseRefs(content),
            sequenceOrder: sequence++
        });
    }
  });

  return chunks;
}