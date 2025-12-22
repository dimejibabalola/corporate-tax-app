
import { detectStructureFromText, detectSectionsFromChapter, generateChunksFromText } from '../src/lib/parser.ts';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../public/fundamentals.txt');

try {
    const text = fs.readFileSync(filePath, 'utf-8');
    console.log(`Reading file from ${filePath}`);
    console.log(`Text length: ${text.length}`);

    const { chapters } = detectStructureFromText(text);
    console.log(`\n=== CHAPTER DETECTION ===`);
    console.log(`Found ${chapters.length} chapters.`);

    chapters.forEach(c => {
        console.log(`  Chapter ${c.number}: "${c.title}" (lines ${c.startLine}-${c.endLine})`);
    });

    // Test section detection on first few chapters
    console.log(`\n=== SECTION DETECTION (Sample) ===`);
    const lines = text.split('\n');

    for (let i = 0; i < Math.min(3, chapters.length); i++) {
        const chapter = chapters[i];
        const chapterLines = lines.slice(chapter.startLine, chapter.endLine);
        const chapterText = chapterLines.join('\n');

        const sections = detectSectionsFromChapter(chapterText, chapter.startLine);
        console.log(`\nChapter ${chapter.number}: "${chapter.title}"`);
        console.log(`  Found ${sections.length} sections:`);

        sections.slice(0, 10).forEach(s => {
            console.log(`    [${s.type}] ${s.label}. ${s.title}`);
        });
        if (sections.length > 10) {
            console.log(`    ... and ${sections.length - 10} more sections`);
        }
    }

    // Test chunk generation
    console.log(`\n=== CHUNK GENERATION ===`);
    const chunks = generateChunksFromText(text, chapters, 'test-textbook-id');
    console.log(`Generated ${chunks.length} chunks total.`);

    // Show sample chunks with section context
    const chunksWithContext = chunks.filter(c => c.sectionContext);
    console.log(`Chunks with section context: ${chunksWithContext.length}`);

    console.log(`\nSample chunks:`);
    for (let i = 0; i < Math.min(5, chunks.length); i++) {
        const c = chunks[i];
        console.log(`  Chunk ${i + 1}: ${c.tokenCount} tokens, section: "${c.sectionContext || 'none'}"`);
        console.log(`    Preview: "${c.content.slice(0, 80)}..."`);
    }

    console.log(`\n=== SUCCESS ===`);

} catch (error) {
    console.error("Error reading file or parsing:", error);
}
