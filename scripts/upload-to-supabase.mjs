/**
 * Upload textbook content to Supabase
 * Run with: node scripts/upload-to-supabase.mjs
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const SUPABASE_URL = 'https://wjokjfaffcboifkxkhlz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indqb2tqZmFmZmNib2lma3hraGx6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjUxNzYzMCwiZXhwIjoyMDgyMDkzNjMwfQ.M72qJ5Tud5oaNJUEa0PW5C8M0dddKzWqhSwTo4eGOcQ';

const CHAPTER_DEFINITIONS = [
  { number: 1, title: 'An Overview of the Taxation of Corporations and Shareholders', startPage: 3, endPage: 68 },
  { number: 2, title: 'Formation of a Corporation', startPage: 71, endPage: 168 },
  { number: 3, title: 'Capital Structure', startPage: 169, endPage: 207 },
  { number: 4, title: 'Nonliquidating Distributions', startPage: 209, endPage: 274 },
  { number: 5, title: 'Redemptions and Partial Liquidations', startPage: 275, endPage: 346 },
  { number: 6, title: 'Stock Dividends and Section 306 Stock', startPage: 347, endPage: 381 },
  { number: 7, title: 'Complete Liquidations', startPage: 383, endPage: 426 },
  { number: 8, title: 'Taxable Corporate Acquisitions', startPage: 427, endPage: 471 },
  { number: 9, title: 'Acquisitive Reorganizations', startPage: 473, endPage: 565 },
  { number: 10, title: 'Corporate Divisions', startPage: 567, endPage: 634 },
  { number: 11, title: 'Nonacquisitive, Nondivisive Reorganizations', startPage: 635, endPage: 661 },
  { number: 12, title: 'Carryovers of Corporate Tax Attributes', startPage: 663, endPage: 730 },
  { number: 13, title: 'Affiliated Corporations', startPage: 731, endPage: 785 },
  { number: 14, title: 'Anti-Avoidance Rules', startPage: 787, endPage: 834 },
  { number: 15, title: 'S Corporations', startPage: 835, endPage: 910 },
];

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

// Section pattern matching
const SECTION_PATTERN = /^([A-H])\.\s+(.+)/i;

function parseChapterSections(blocks, chapterStartPage) {
  const sections = [];
  let currentSection = null;

  for (const block of blocks) {
    if (block.type !== 'text' || block.text_level !== 1) continue;

    const text = block.text?.trim() || '';
    const pageIdx = block.page_idx || 0;

    const sectionMatch = text.match(SECTION_PATTERN);
    if (sectionMatch) {
      if (currentSection) {
        currentSection.endPageIdx = pageIdx - 1;
      }
      currentSection = {
        letter: sectionMatch[1].toUpperCase(),
        title: sectionMatch[2].trim().replace(/\s+/g, ' '),
        startPageIdx: pageIdx,
      };
      sections.push(currentSection);
    }
  }

  // Close last section
  if (currentSection && blocks.length > 0) {
    const lastPageIdx = Math.max(...blocks.map(b => b.page_idx || 0));
    currentSection.endPageIdx = lastPageIdx;
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

async function uploadChapter(chapterNum) {
  const chapterDef = CHAPTER_DEFINITIONS.find(c => c.number === chapterNum);
  if (!chapterDef) {
    console.log(`Chapter ${chapterNum} not found in definitions`);
    return;
  }

  // Try to load MinerU content
  const contentPath = path.join(process.cwd(), `public/data/mineru/Ch${chapterNum}/content_list.json`);
  
  if (!fs.existsSync(contentPath)) {
    console.log(`No MinerU content for Chapter ${chapterNum} at ${contentPath}`);
    return;
  }

  console.log(`Loading Chapter ${chapterNum} from ${contentPath}...`);
  const rawBlocks = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
  console.log(`  Found ${rawBlocks.length} blocks`);

  const chapterId = `ch-${chapterNum}`;

  // Parse sections
  const parsedSections = parseChapterSections(rawBlocks, chapterDef.startPage);
  console.log(`  Parsed ${parsedSections.length} sections`);

  // Upload chapter
  console.log('  Uploading chapter...');
  await supabaseRequest('chapters', 'POST', {
    id: chapterId,
    textbook_id: 'corporate-tax',
    part_id: chapterNum <= 1 ? 'part-1' : 'part-2',
    number: chapterNum,
    title: chapterDef.title,
    start_page: chapterDef.startPage,
    end_page: chapterDef.endPage,
  });

  // Upload sections
  console.log('  Uploading sections...');
  for (const ps of parsedSections) {
    const sectionId = `${chapterId}-${ps.letter}`;
    const sectionStartPage = chapterDef.startPage + ps.startPageIdx;
    const sectionEndPage = ps.endPageIdx !== undefined
      ? chapterDef.startPage + ps.endPageIdx
      : chapterDef.endPage;

    await supabaseRequest('sections', 'POST', {
      id: sectionId,
      textbook_id: 'corporate-tax',
      chapter_id: chapterId,
      letter: ps.letter,
      title: ps.title,
      start_page: sectionStartPage,
      end_page: sectionEndPage,
    });
  }

  // Group blocks by page
  const blocksByPage = new Map();
  for (const block of rawBlocks) {
    const pageIdx = block.page_idx || 0;
    if (!blocksByPage.has(pageIdx)) {
      blocksByPage.set(pageIdx, []);
    }
    blocksByPage.get(pageIdx).push(block);
  }

  // Upload pages
  console.log('  Uploading pages...');
  const pagesInChapter = chapterDef.endPage - chapterDef.startPage + 1;
  let pagesUploaded = 0;

  for (let pageOffset = 0; pageOffset < pagesInChapter; pageOffset++) {
    const bookPageNum = chapterDef.startPage + pageOffset;
    
    const matchingSection = findSectionForPage(pageOffset, parsedSections);
    const sectionId = matchingSection
      ? `${chapterId}-${matchingSection.letter}`
      : `${chapterId}-A`;
    const sectionTitle = matchingSection?.title || chapterDef.title;
    
    const startsSection = parsedSections.some(s => s.startPageIdx === pageOffset);
    
    const pageBlocks = blocksByPage.get(pageOffset) || [];
    const pageContent = JSON.stringify(pageBlocks);

    await supabaseRequest('textbook_pages', 'POST', {
      id: uuidv4(),
      chapter_id: chapterId,
      section_id: sectionId,
      section_title: sectionTitle,
      page_number: bookPageNum,
      content: pageContent,
      starts_new_section: startsSection,
    });
    
    pagesUploaded++;
    if (pagesUploaded % 10 === 0) {
      console.log(`    ${pagesUploaded}/${pagesInChapter} pages...`);
    }
  }

  console.log(`  ✅ Chapter ${chapterNum} uploaded: ${pagesUploaded} pages, ${parsedSections.length} sections`);
}

async function main() {
  console.log('Starting Supabase upload...\n');

  // Check which chapters have MinerU content
  const mineruDir = path.join(process.cwd(), 'public/data/mineru');
  const availableChapters = [];
  
  for (let i = 1; i <= 15; i++) {
    const contentPath = path.join(mineruDir, `Ch${i}/content_list.json`);
    if (fs.existsSync(contentPath)) {
      availableChapters.push(i);
    }
  }

  console.log(`Found MinerU content for chapters: ${availableChapters.join(', ')}\n`);

  for (const chapterNum of availableChapters) {
    try {
      await uploadChapter(chapterNum);
    } catch (error) {
      console.error(`Error uploading chapter ${chapterNum}:`, error.message);
    }
  }

  console.log('\n✅ Upload complete!');
}

main().catch(console.error);
