
import json
import re
import sys

# Paths
HTML_PATH = 'parsed-chapters/Ch1_complete_fixed.html'
JSON_PATH = 'parsed-chapters/b9d4ca4f-b3c1-46c5-b03c-6c50cd2f3ea7_content_list.json'
OUTPUT_PATH = 'public/Ch1_complete.html'

# Rules
HIERARCHY_RULES = [
    # (Regex pattern, Tag name, Class name)
    (r'^[A-H]\.\s', 'h2', 'main-section'),
    (r'^\d+\.\s', 'h3', 'subsection'),
    (r'^[a-z]\.\s', 'h4', 'sub-subsection')
]

CSS = """
    <style>
        body {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            font-family: Georgia, serif;
            font-size: 16px;
            line-height: 1.7;
            color: #1a1a1a;
        }
        
        /* SECTION HEADERS */
        h1.chapter-title {
            font-size: 28px;
            text-align: center;
            margin-bottom: 2em;
        }
        h2.main-section {
            font-size: 20px;
            font-weight: bold;
            margin-top: 2.5em;
            margin-bottom: 1em;
            border-bottom: 1px solid #ccc;
            padding-bottom: 0.3em;
        }
        h3.subsection {
            font-size: 18px;
            font-weight: bold;
            margin-top: 2em;
            margin-bottom: 0.8em;
        }
        h4.sub-subsection {
            font-size: 16px;
            font-weight: bold;
            font-style: italic;
            margin-top: 1.5em;
            margin-bottom: 0.6em;
        }
        
        /* PARAGRAPHS - CRITICAL */
        p {
            margin: 1em 0;
            text-align: justify;
        }
        
        /* PAGE MARKERS */
        .page-marker {
            display: block;
            text-align: right;
            font-size: 12px;
            color: #888;
            margin: 1em 0;
            padding-top: 1em;
            border-top: 1px dotted #ddd;
        }
        
        /* FOOTNOTES */
        .fn-ref {
            font-size: 0.75em;
            vertical-align: super;
        }
        .fn-ref a {
            color: #0066cc;
            text-decoration: none;
        }
        .footnote {
            font-size: 0.9em;
            padding: 0.5em 0;
            border-bottom: 1px solid #eee;
        }
        .fn-num {
            font-weight: bold;
            color: #0066cc;
        }
        
        /* CASE EXCERPTS */
        .case-excerpt {
            background: #f9f9f9;
            border-left: 4px solid #666;
            padding: 1.5em;
            margin: 2em 0;
        }
        .case-citation {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 1em;
        }
        
        /* BLOCK QUOTES / EXCERPTS */
        blockquote, .excerpt {
            margin: 1.5em 2em;
            padding-left: 1em;
            border-left: 3px solid #ccc;
            font-style: italic;
        }
    </style>
"""

def title_case(text):
    keep_upper = ['IRC', 'I.R.C.', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'LLC', 'LLCs', 'IRS', 'OECD', 'US', 'U.S.']
    words = text.split()
    new_words = []
    
    # Check if text is all caps (roughly)
    if not text.isupper() and not any(c.isupper() for c in text if c.isalpha()):
         pass # Already mixed case, maybe just fix title conventions?
         pass 

    # If it is ALL CAPS, convert. 
    # Just force Title Case for headers generally as per convention?
    # User sample "Influential Policies" was Title Case.
    
    for i, word in enumerate(words):
        clean_word = word.strip('.,()[]').upper()
        if clean_word in keep_upper:
            new_words.append(word.upper() if word.upper() in keep_upper else word)
        elif i > 0 and word.lower() in ['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'onto', 'out', 'over', 'up', 'with', 'to', 'as', 'vs.']:
            new_words.append(word.lower())
        else:
            new_words.append(word.capitalize())
            
    return ' '.join(new_words)

def get_page_starts(json_path):
    # Returns dict: page_num -> string_start_snippet
    # Logic: Page 3 starts at page_idx 0. Page 4 at page_idx 1.
    # The first 'text' block of page_idx 1 is the start of Page 4.
    
    with open(json_path, 'r') as f:
        data = json.load(f)
        
    page_starts = {} # page_num(int) -> text_snippet
    
    # Scan for first text of each page_idx
    seen_indices = set()
    current_page_idx = -1
    
    # We assume page_idx maps 0->Page 3, 1->Page 4 ...
    # Let's map page_idx to actual page number by finding "page_number" items
    # But "page_number" item usually appears at the end of the page content in PDF flow.
    # So if we see page_idx change, the NEW content belongs to the NEXT page?
    # Or does `page_idx` grouped content belong to that page?
    # Yes, `page_idx` 0 is Page 3. `page_idx` 1 is Page 4.
    
    page_map = {} # idx -> page_num
    # Default assuming 0=3, 1=4 if not found
    for item in data:
        idx = item.get('page_idx')
        if item.get('type') == 'page_number' and item.get('text').isdigit():
             page_map[idx] = int(item.get('text'))
             
    last_idx = -1
    for item in data:
        idx = item.get('page_idx')
        if idx is None: continue
        
        if idx != last_idx and item.get('type') == 'text' and item.get('text'):
            # New page started
            # Determine page number
            # If idx=0, page=3. If idx=1, page=4?
            # Use page_map if available, else derive
            p_num = page_map.get(idx, idx + 3) 
            text = item.get('text').strip()
            # Clean text of footnotes markers for matching [1]
            text_clean = re.sub(r'\[\d+\]', '', text)
            # Take first 50 chars
            snippet = text_clean[:50]
            if p_num not in page_starts:
                page_starts[p_num] = snippet
            last_idx = idx
            
    return page_starts

def process_html():
    with open(HTML_PATH, 'r') as f:
        raw_html = f.read()

    # Naive cleanup of the Pandoc HTML
    # Remove head/body tags to process content lines
    # Split by lines to iterate
    # But wait, pandoc wraps lines. We need to reconstruct full <p> blocks first?
    # The file has <p>...</p> but lines are broken inside.
    # Regex replace to remove newlines inside tags?
    # Or just read as text, regex replace `\n` not followed by `<`?
    
    # First, let's normalize the HTML str
    # Remove newlines that are just wrapping
    normalized_html = raw_html.replace('\n', ' ')
    # Now restore major tags to have newlines for processing
    normalized_html = normalized_html.replace('</p>', '</p>\n')
    normalized_html = normalized_html.replace('</h1>', '</h1>\n')
    normalized_html = normalized_html.replace('</h2>', '</h2>\n')
    normalized_html = normalized_html.replace('</h3>', '</h3>\n')
    normalized_html = normalized_html.replace('</h4>', '</h4>\n')
    
    lines = normalized_html.split('\n')
    
    page_starts = get_page_starts(JSON_PATH)
    # Sort page starts by page num
    sorted_pages = sorted(page_starts.keys())
    next_page_idx = 0
    
    output_lines = []
    
    output_lines.append('<!DOCTYPE html>')
    output_lines.append('<html lang="en">')
    output_lines.append('<head>')
    output_lines.append('<meta charset="UTF-8">')
    output_lines.append('<title>Chapter 1: Overview of Corporate Taxation</title>')
    output_lines.append(CSS)
    output_lines.append('</head>')
    output_lines.append('<body>')
    
    # Add Page 3 marker at start (approximate)
    output_lines.append('<span class="page-marker" id="page-3">[Page 3]</span>')
    
    # Regex to clean tags for matching
    def strip_tags(s):
        return re.sub(r'<[^>]+>', '', s)

    # Main content loop
    for line in lines:
        line = line.strip()
        if not line: continue
        
        # Check for page break
        if next_page_idx < len(sorted_pages):
            p_num = sorted_pages[next_page_idx]
            if p_num > 3: # Page 3 already added
                start_snippet = page_starts[p_num]
                # Check if this line contains the snippet
                # Fuzzy match ignoring spaces
                line_text_clean = strip_tags(line).replace(' ', '')
                snippet_clean = start_snippet.replace(' ', '')
                
                if snippet_clean in line_text_clean and snippet_clean:
                    output_lines.append(f'<span class="page-marker" id="page-{p_num}">[Page {p_num}]</span>')
                    next_page_idx += 1
        
        # Check hierarchy
        tag = None
        new_line = line
        
        # Convert P to H based on text content
        text_content = strip_tags(line)
        
        # Check patterns
        matched_header = False
        
        # Detect Chapter Title
        if "AN OVERVIEW OF THE TAXATION OF CORPORATIONS AND SHAREHOLDERS" in text_content.upper():
             new_line = f'<h1 class="chapter-title">{title_case(text_content)}</h1>'
             matched_header = True
             
        if not matched_header:
            for pattern, tag_name, class_name in HIERARCHY_RULES:
                if re.match(pattern, text_content):
                    # It's a header.
                    # Slugify ID
                    # Remove the prefix for the slug?
                    # User sample: "B. Influential Policies" -> id="section-b"
                    # "1. Tax Considerations"
                    
                    # My previous logic used simplified slug "introduction".
                    # Let's try to match that logic so I don't break Chapter1.tsx again.
                    # ID creation:
                    parts = text_content.split(' ', 1)
                    if len(parts) > 1:
                        title_text = parts[1]
                        slug = title_text.lower().replace(' ', '-').replace("'", "").replace(',', '').replace('.', '')
                    else:
                        slug = text_content.lower().replace('.', '')
                        
                    # Title Case the content
                    # We might need to split numbering 'A.' and title
                    match_res = re.match(r'^([A-Z0-9a-z]+\.)\s+(.*)', text_content)
                    if match_res:
                        prefix = match_res.group(1)
                        rest = match_res.group(2)
                        # Fix casing
                        rest = title_case(rest)
                        new_content = f"{prefix} {rest}"
                    else:
                        new_content = title_case(text_content)

                    new_line = f'<{tag_name} class="{class_name}" id="{slug}">{new_content}</{tag_name}>'
                    matched_header = True
                    break
        
        # Normalize footnotes
        # Pandoc uses <a href="#fn-1" id="fn-ref-1">[1]</a> or similar.
        # User wants <sup class="fn-ref"><a href="#fn-1">[1]</a></sup>
        # Existing: <sup class="fn-ref"><a href="#fn-1" id="fn-ref-1">[1]</a></sup> (from view line 261)
        # It seems mostly correct already.
        
        output_lines.append(new_line)

    output_lines.append('</body>')
    output_lines.append('</html>')
    
    with open(OUTPUT_PATH, 'w') as f:
        f.write('\n'.join(output_lines))
        
    print(f"Processed 3 sources. Output to {OUTPUT_PATH}")

if __name__ == '__main__':
    process_html()
