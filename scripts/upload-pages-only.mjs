/**
 * Upload textbook pages to Supabase (pages only, chapters/sections already exist)
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = 'https://wjokjfaffcboifkxkhlz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb2tqZmFmZmNib2lma3hraGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUxNzYzMCwiZXhwIjoyMDgyMDkzNjMwfQ.M72qJ5Tud5oaNJUEa0PW5C8M0dddKzWqhSwTo4eGOcQ';

const CHAPTER_DEFINITIONS = [
  { number: 1, title: 'An Overview of the Taxation of Corporations and Shareholders', startPage: 3, endPage: 68 },
];

const SECTION_PATTERN = /^([A-H])\.\s+(.+)/i;

async function supabaseRequest(endpoint, method, body) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error: ${response.status} ${text}`);
  }
  return response;
}

function parseChapterSections(blocks) {
  const sections = [];
  let currentSection = null;

  for (const block of blocks) {
    if (block.type !== 'text' || block.text_level !== 1) continue;
    const text = block.text?.trim() || '';
    const pageIdx = block.page_idx || 0;

    const sectionMatch = text.match(SECTION_PATTERN);
    if (sectionMatch) {
      if (currentSection) currentSection.endPageIdx = pageIdx - 1;
      currentSection = {
        letter: sectionMatch[1].toUpperCase(),
        title: sectionMatch[2].trim(),
        startPageIdx: pageIdx,
      };
      sections.push(currentSection);
    }
  }

  if (currentSection && blocks.length > 0) {
    currentSection.endPageIdx = Math.max(...blocks.map(b => b.page_idx || 0));
  }

  return sections;
}

function findSectionForPage(pageIdx, sections) {
  for (const section of sections) {
    if (pageIdx >= section.startPageIdx && (section.endPageIdx === undefined || pageIdx <= section.endPageIdx)) {
      return section;
    }
  }
  return sections[0] || null;
}

async function uploadPages(chapterNum) {
  const chapterDef = CHAPTER_DEFINITIONS.find(c => c.number === chapterNum);
  if (!chapterDef) return;

  const contentPath = path.join(process.cwd(), `public/data/mineru/Ch${chapterNum}/content_list.json`);
  if (!fs.existsSync(contentPath)) {
    console.log(`No content for Chapter ${chapterNum}`);
    return;
  }

  console.log(`Loading Chapter ${chapterNum}...`);
  const rawBlocks = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
  console.log(`  Found ${rawBlocks.length} blocks`);

  const chapterId = `ch-${chapterNum}`;
  const parsedSections = parseChapterSections(rawBlocks);
  console.log(`  Parsed ${parsedSections.length} sections`);

  // Group blocks by page
  const blocksByPage = new Map();
  for (const block of rawBlocks) {
    const pageIdx = block.page_idx || 0;
    if (!blocksByPage.has(pageIdx)) blocksByPage.set(pageIdx, []);
    blocksByPage.get(pageIdx).push(block);
  }

  // Upload pages in batches
  console.log('  Uploading pages...');
  const pagesInChapter = chapterDef.endPage - chapterDef.startPage + 1;
  const batchSize = 10;
  let pagesUploaded = 0;

  for (let batchStart = 0; batchStart < pagesInChapter; batchStart += batchSize) {
    const batch = [];
    
    for (let i = 0; i < batchSize && batchStart + i < pagesInChapter; i++) {
      const pageOffset = batchStart + i;
      const bookPageNum = chapterDef.startPage + pageOffset;
      
      const matchingSection = findSectionForPage(pageOffset, parsedSections);
      const sectionId = matchingSection ? `${chapterId}-${matchingSection.letter}` : `${chapterId}-A`;
      const sectionTitle = matchingSection?.title || chapterDef.title;
      const startsSection = parsedSections.some(s => s.startPageIdx === pageOffset);
      
      const pageBlocks = blocksByPage.get(pageOffset) || [];
      const pageContent = JSON.stringify(pageBlocks);

      batch.push({
        id: uuidv4(),
        chapter_id: chapterId,
        section_id: sectionId,
        section_title: sectionTitle,
        page_number: bookPageNum,
        content: pageContent,
        starts_new_section: startsSection,
      });
    }

    if (batch.length > 0) {
      await supabaseRequest('textbook_pages', 'POST', batch);
      pagesUploaded += batch.length;
      console.log(`    ${pagesUploaded}/${pagesInChapter} pages...`);
    }
  }

  console.log(`  ✅ Uploaded ${pagesUploaded} pages for Chapter ${chapterNum}`);
}

async function main() {
  console.log('Uploading pages to Supabase...\n');
  
  for (const chapterDef of CHAPTER_DEFINITIONS) {
    await uploadPages(chapterDef.number);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);
