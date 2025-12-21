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
        // Simple heuristic: Chapter headers usually have some spacing or are distinct
        // For now, we accept them if they increment the chapter count
        
        const lastChapter = chapters[chapters.length - 1];
        const newNumber = chapters.length + 1;
        
        // If we found a chapter match
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

  // Fallback: One big chapter if none found
  if (chapters.length === 0) {
    chapters.push({
      number: 1,
      title: "Full Text",
      startLine: 0,
      endLine: lines.length
    });
  } else {
    // Fix end lines
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
    // Matches: "Name v. Name"
    // Handles: "Commissioner v. Tufts", "In re Estate of Smith"
    // Heuristic: Capitalized words surrounding " v. "
    const caseRegex = /([A-Z][\w\.,]+(?:\s+[A-Z][\w\.,]+)*\s+v\.\s+[A-Z][\w\.,]+(?:\s+[A-Z][\w\.,]+)*)/g;
    const refs = text.match(caseRegex);
    return refs ? Array.from(new Set(refs)) : [];
}

function extractStatutoryRefs(text: string): string[] {
    // Matches: "§ 351", "IRC § 368(a)(1)(A)", "Section 1001"
    const statuteRegex = /((?:IRC\s+|Section\s+|Sec\.\s+)?§\s*\d+[A-Za-z0-9\(\)]*)/g;
    const refs = text.match(statuteRegex);
    return refs ? Array.from(new Set(refs)) : [];
}

function estimateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

// ------------------------------------------------------------------
// Stage 3: Chunking
// ------------------------------------------------------------------

export function generateChunksFromText(text: string, chapters: ParsedChapter[], textbookId: string) {
  const lines = text.split('\n');
  const chunks: any[] = [];
  let sequence = 0;

  chapters.forEach(chapter => {
    // Extract lines for this chapter
    const chapterLines = lines.slice(chapter.startLine, chapter.endLine);
    const chapterText = chapterLines.join('\n');
    
    // Split by double newline (paragraphs)
    const paragraphs = chapterText.split(/\n\s*\n/);
    
    let currentChunkText = [];
    let currentTokens = 0;
    const TARGET_TOKENS = 600;
    
    const commitChunk = () => {
         if (currentChunkText.length === 0) return;
         
         const content = currentChunkText.join('\n\n');
         chunks.push({
            id: uuidv4(),
            textbookId,
            chapterId: chapter.id, // ID must be injected by caller before passing here, or we use index map
            content,
            pageNumbers: [], // Text files don't have pages usually, could approximate
            tokenCount: currentTokens,
            statutoryRefs: extractStatutoryRefs(content),
            caseRefs: extractCaseRefs(content),
            sequenceOrder: sequence++
        });
        currentChunkText = [];
        currentTokens = 0;
    };

    for (const para of paragraphs) {
        if (!para.trim()) continue;
        
        const paraTokens = estimateTokens(para);
        
        if (currentTokens + paraTokens > TARGET_TOKENS) {
            commitChunk();
        }
        
        currentChunkText.push(para);
        currentTokens += paraTokens;
    }
    
    // Final commit
    commitChunk();
  });

  return chunks;
}