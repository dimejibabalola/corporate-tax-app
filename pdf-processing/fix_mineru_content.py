#!/usr/bin/env python3
"""
MinerU Content Fixer Script with Smart Footnote Recovery

Processes MinerU middle.json to:
1. Fix heading hierarchy using bbox height
2. Inject HTML for "CHAPTER X" eyebrow labels
3. Recover footnotes from discarded_blocks using page position analysis
4. Output clean Markdown with HTML passthrough

Usage:
    python fix_mineru_content.py <input_middle.json> <output.md>

Example:
    python fix_mineru_content.py Ch1_Intro_to_Corp_Tax_middle.json Fixed_Chapter_1.md
"""

import json
import re
import sys
from pathlib import Path


def extract_text_from_block(block: dict) -> str:
    """Extract text from a MinerU block (handles nested lines/spans structure)."""
    text = ""
    
    # Direct text field (content_list.json style)
    if 'text' in block and isinstance(block['text'], str):
        return block['text'].strip()
    
    # Nested lines/spans structure (middle.json style)
    if 'lines' in block:
        for line in block['lines']:
            for span in line.get('spans', []):
                text += span.get('content', '') + " "
            text += "\n"
    
    return text.strip()


def process_mineru_json(json_path: str, output_md_path: str):
    """Process MinerU middle.json with smart footnote recovery."""
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    full_text = []
    total_footnotes = 0
    
    # Handle different JSON structures
    pages = data.get('pdf_info', [])
    if not pages and isinstance(data, list):
        # content_list.json structure - flat array
        pages = [{'preproc_blocks': data}]
    
    for page_index, page in enumerate(pages):
        page_content = []
        footnotes = []
        
        # 1. Get the Main Content
        blocks = page.get('preproc_blocks', page.get('blocks', []))
        
        # 2. Get the "Trash" (Discarded Blocks) - where MinerU hides footnotes
        discarded = page.get('discarded_blocks', [])
        
        # Combine them to scan everything, but track source
        all_blocks = []
        for b in blocks:
            b['_source'] = 'main'
            all_blocks.append(b)
        for b in discarded:
            b['_source'] = 'discarded'
            all_blocks.append(b)
        
        # Sort everything from top to bottom
        all_blocks.sort(key=lambda x: x.get('bbox', [0, 0, 0, 0])[1])
        
        # 3. Calculate Page Thresholds
        # Footnotes are usually in the bottom 25% of the page
        page_size = page.get('page_size', [612, 792])  # Default letter size
        page_height = page_size[1] if len(page_size) > 1 else 792
        footnote_zone_start = page_height * 0.75
        
        for block in all_blocks:
            text = extract_text_from_block(block)
            if not text:
                continue
            
            # Get geometry
            bbox = block.get('bbox', [0, 0, 0, 0])
            y_position = bbox[1] if len(bbox) > 1 else 0
            block_height = (bbox[3] - bbox[1]) if len(bbox) >= 4 else 0
            source = block.get('_source', 'main')
            block_type = block.get('type', 'text')
            
            # 4. LOGIC: Is this a Footnote?
            # Criteria:
            # A) Starts with a number (e.g., "1 ", "179.")
            # B) Is in the bottom zone OR was explicitly discarded
            # C) Is NOT just a page number (e.g., "51" or "Page 51")
            
            starts_with_number = re.match(r'^(\d+)[.\s]', text)
            is_bottom = y_position > footnote_zone_start
            is_short_page_num = re.match(r'^\d+$', text.strip()) or re.match(r'^Page\s+\d+', text, re.IGNORECASE)
            
            if starts_with_number and (is_bottom or source == 'discarded') and not is_short_page_num:
                # Found a footnote!
                footnotes.append(text.replace('\n', ' ').strip())
                
            elif source == 'main':
                # This is real content - apply hierarchy logic
                is_title = block_type in ('title', 'heading') or block.get('text_level', 0) > 0
                
                if is_title:
                    # EYEBROW: "CHAPTER X" with explicit HTML
                    if re.match(r'^CHAPTER\s+\w+$', text, re.IGNORECASE):
                        page_content.append(f'<div class="chapter-eyebrow">{text}</div>\n')
                    
                    # EYEBROW: "PART X" with explicit HTML
                    elif re.match(r'^PART\s+\w+$', text, re.IGNORECASE):
                        page_content.append(f'<div class="chapter-eyebrow">{text}</div>\n')
                    
                    # H1: Massive titles (height > 50)
                    elif block_height > 50:
                        page_content.append(f"# {text}\n")
                    
                    # H2: Section headers (height > 15)
                    elif block_height > 15:
                        page_content.append(f"## {text}\n")
                    
                    # H3: Subsections
                    else:
                        page_content.append(f"### {text}\n")
                else:
                    # Regular body text
                    page_content.append(f"{text}\n")
        
        # 5. Assemble Page Content
        full_text.extend(page_content)
        
        # Append Footnotes at end of page with HTML styling
        if footnotes:
            full_text.append('\n<div class="page-footnotes">\n')
            full_text.append(f'<div class="footnotes-header">Page {page_index + 1} Footnotes</div>\n')
            for fn in footnotes:
                full_text.append(f'<div class="footnote-item">{fn}</div>\n')
            full_text.append('</div>\n\n')
            total_footnotes += len(footnotes)
    
    # Write Output
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(full_text))
    
    print(f"✅ Processed {len(pages)} pages")
    print(f"✅ Recovered {total_footnotes} footnotes (using page-position analysis)")
    print(f"✅ Output written to: {output_md_path}")


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        print("\nError: Please provide input and output file paths")
        print("Usage: python fix_mineru_content.py <input.json> <output.md>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not Path(input_path).exists():
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    
    process_mineru_json(input_path, output_path)


if __name__ == "__main__":
    main()
