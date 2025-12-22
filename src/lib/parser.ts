import { v4 as uuidv4 } from 'uuid';

export interface ParsedChapter {
  number: number;
  title: string;
  startLine: number;
  endLine: number;
}

// ------------------------------------------------------------------
// Stage 1: Structure Detection (Text Optimized)
// ------------------------------------------------------------------

const CHAPTER_PATTERNS = [
  /^Chapter\s+(\d+)[:\s]+(.+)$/i,
  /^CHAPTER\s+(\d+)[:\s]+(.+)$/i,
  /^Part\s+([IVXLC]+)[:\s]+(.+)$/i,
  /^Unit\s+(\d+)[:\s]+(.+)$/i,
  /^(\d+)\.\s+([A-Z][A-Z\s]+)$/ // "1. CORPORATE FORMATIONS"
];

export function detectStructureFromText(text: string): { chapters: ParsedChapter[] } {
  const lines = text.split('\n');
  const chapters: ParsedChapter[] = [];
  
  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    for (const pattern of CHAPTER_PATTERNS) {
      const match = cleanLine.match(pattern);
      if (match) {
        // Avoid duplicate/noisy headers (e.g. table of contents)
        const lastChapter = chapters[chapters.length - 1];
        const newNumber = chapters.length + 1;
        
        chapters.push({
          number: newNumber,
          title: match[2].trim(),
          startLine: index,
          endLine: index // Will update
        });
        break; 
      }
    }
  });

  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: "Full Text",
      startLine: 0,
      endLine: lines.length
    });
  } else {
    for (let i = 0; i < chapters.length; i++) {
      chapters[i].endLine = chapters[i + 1] ? chapters[i + 1].startLine - 1 : lines.length;
    }
  }

  return { chapters };
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
// Stage 3: Granular Chunking
// ------------------------------------------------------------------

export function generateChunksFromText(text: string, chapters: ParsedChapter[], textbookId: string) {
  const lines = text.split('\n');
  const chunks: any[] = [];
  let sequence = 0;

  chapters.forEach(chapter => {
    const chapterLines = lines.slice(chapter.startLine, chapter.endLine);
    
    // Improved Logic:
    // 1. Join lines into a single text block
    // 2. Split strictly by double newlines to isolate paragraphs
    // 3. Keep chunks small (don't merge unless tiny)
    
    const chapterText = chapterLines.join('\n');
    const paragraphs = chapterText.split(/\n\s*\n/);
    
    let buffer: string[] = [];
    let bufferTokens = 0;
    const MIN_TOKENS = 50; // Don't make chunks smaller than this if possible
    const MAX_TOKENS = 400; // Force split if larger than this
    
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
        
        // If adding this paragraph exceeds max, commit current buffer first
        if (bufferTokens + paraTokens > MAX_TOKENS) {
            commitBuffer();
        }
        
        buffer.push(para);
        bufferTokens += paraTokens;
        
        // If we have enough context (>= MIN_TOKENS), commit immediately
        // This ensures distinct concepts stay distinct
        if (bufferTokens >= MIN_TOKENS) {
            commitBuffer();
        }
    }
    
    // Final commit
    commitBuffer();
  });

  return chunks;
}