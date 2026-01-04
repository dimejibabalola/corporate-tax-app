import json
import re
import os

JSON_FILE = 'parsed-chapters/b9d4ca4f-b3c1-46c5-b03c-6c50cd2f3ea7_content_list.json'
OUTPUT_FILE = 'public/Ch1_complete.html'

def title_case(text):
    # Keep specific terms uppercase
    keep_upper = ['IRC', 'I.R.C.', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'LLC', 'LLCs', 'IRS', 'OECD', 'US', 'U.S.']
    
    words = text.split()
    new_words = []
    for word in words:
        # Check stripping punctuation for key check
        clean_word = word.strip('.,()[]')
        if clean_word in keep_upper:
            new_words.append(word)
        elif word.lower() in ['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'at', 'by', 'for', 'from', 'in', 'into', 'of', 'off', 'on', 'onto', 'out', 'over', 'up', 'with', 'to', 'as', 'vs.']:
            new_words.append(word.lower())
        else:
            new_words.append(word.capitalize())
            
    # Always capitalize first word
    if new_words:
        new_words[0] = new_words[0].capitalize()
        
    return ' '.join(new_words)

CSS_STYLES = """
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

def generate_html_from_json():
    with open(JSON_FILE, 'r') as f:
        data = json.load(f)
        
    html_parts = []
    
    html_parts.append('<!DOCTYPE html>')
    html_parts.append('<html lang="en">')
    html_parts.append('<head>')
    html_parts.append('<meta charset="UTF-8">')
    html_parts.append('<title>Chapter 1: Overview of Corporate Taxation</title>')
    html_parts.append(CSS_STYLES)
    html_parts.append('</head>')
    html_parts.append('<body>')
    
    footnotes = {} # id -> text
    
    # Track hierarchy for correct slug generation
    # Just simple regex matching for now based on text content
    
    for item in data:
        item_type = item.get('type')
        text = item.get('text', '').strip()
        page_idx = item.get('page_idx', 0)
        
        if not text:
            continue
            
        # Detect page number blocks from content list if type is page_number
        if item_type == 'page_number':
            # Use page number from text if available, or just fallback to page_idx+some_offset?
            # JSON has "text": "3" for page 3.
            page_num = text
            html_parts.append(f'<span class="page-marker" id="page-{page_num}">[Page {page_num}]</span>')
            continue
            
        if item_type == 'page_footnote':
            # Need to extract footnote number. Usually starts with multiple digits or just [1] or 1
            # Text often "3 See, e.g..."
            # Let's try to match leading number
            match = re.match(r'^(\d+)\s+(.*)', text)
            if match:
                fn_num = match.group(1)
                fn_text = match.group(2)
                footnotes[fn_num] = fn_text
                # Don't output footnotes inline, we'll dump them at the end.
                continue
            else:
                # Might be continuation or unnumbered?
                # Sometimes footnote text in JSON is just the text if it was linked to a superscript in main text
                # We'll just collect them. If we can't find a number, we might lose it or append to prev?
                # Let's assume most start with number.
                pass
            continue
            
        if item_type == 'header':
            # Usually running headers like "CHAPTER 1", "AN OVERVIEW...", "INTRODUCTION"
            # We can ignore these repeated headers unless they are the Main Title
            if text == "CHAPTER 1":
                # Only if it's the very first one?
                # The user wants "CHAPTER 1: AN OVERVIEW..." as title.
                # We can handle the main title manually or detect it.
                continue
            if "AN OVERVIEW OF THE TAXATION" in text or "AND SHAREHOLDERS" in text:
                continue
            if text in ["INTRODUCTION", "PART1"]:
                 continue
            # If it's a section header designated as header type in JSON (rare for main content)
            pass

        # Main logic for text blocks
        if item_type == 'text':
            # Check for Headers patterns
            
            # TITLE
            if "AN OVERVIEW OF THE TAXATION OF CORPORATIONS AND SHAREHOLDERS" in text:
                 html_parts.append(f'<h1 class="chapter-title">{title_case(text)}</h1>')
                 continue

            # H2: A. Introduction...
            match_h2 = re.match(r'^([A-H])\.\s+(.*)', text)
            if match_h2 and len(text) < 100: # Heuristic: headers are short
                letter = match_h2.group(1)
                title = match_h2.group(2)
                # Slugify title for ID
                slug = title.lower().replace(' ', '-').replace(',', '').replace("'", "")
                html_parts.append(f'<h2 class="main-section" id="{slug}">{letter}. {title_case(title)}</h2>')
                continue
                
            # H3: 1. Tax Considerations...
            match_h3 = re.match(r'^(\d+)\.\s+(.*)', text)
            if match_h3 and len(text) < 100:
                num = match_h3.group(1)
                title = match_h3.group(2)
                slug = title.lower().replace(' ', '-').replace(',', '').replace("'", "")
                html_parts.append(f'<h3 class="subsection" id="{slug}">{num}. {title_case(title)}</h3>')
                continue
                
            # H4: a. Tax Rates...
            match_h4 = re.match(r'^([a-z])\.\s+(.*)', text)
            if match_h4 and len(text) < 100 and not text.startswith('v.'): # Avoid v. case name if starts with line
                 letter = match_h4.group(1)
                 title = match_h4.group(2)
                 slug = title.lower().replace(' ', '-').replace(',', '').replace("'", "")
                 html_parts.append(f'<h4 class="sub-subsection" id="{slug}">{letter}. {title_case(title)}</h4>')
                 continue
            
            # Detect Case Names if they are separate blocks? 
            # JSON usually has paragraph text.
            # Convert [1], [2] etc to footnote links
            
            # Replace [12] with <sup class="fn-ref"><a href="#fn-12">[12]</a></sup>
            # Be careful with years like [2018] which might not be footnotes. 
            # Usually footnotes are small numbers.
            # Regex for [digit+]
            
            # Function to replace fn refs
            def fn_replacer(m):
                val = m.group(1)
                # Check if it's a reasonable footnote number (e.g. < 200)
                if val.isdigit() and int(val) < 200:
                    return f'<sup class="fn-ref"><a href="#fn-{val}">[{val}]</a></sup>'
                return m.group(0)
            
            text = re.sub(r'\[(\d+)\]', fn_replacer, text)
            
            # Also handle superscripts in JSON like <sup>7</sup>
            # text = re.sub(r'<sup>(\d+)</sup>', lambda m: f'<sup class="fn-ref"><a href="#fn-{m.group(1)}">[{m.group(1)}]</a></sup>', text)
            
            # Wrap in P
            html_parts.append(f'<p>{text}</p>')

    # Append Footnotes section
    html_parts.append('<div id="footnotes">')
    html_parts.append('<h3 class="subsection">Footnotes</h3>')
    
    # Sort footnotes by number
    sorted_fns = sorted(footnotes.items(), key=lambda x: int(x[0]) if x[0].isdigit() else 9999)
    
    for num, text in sorted_fns:
        html_parts.append(f'<div class="footnote" id="fn-{num}"><span class="fn-num">{num}.</span> {text} <a href="#page-marker-somewhere?">↩</a></div>')
        
    html_parts.append('</div>')
    
    html_parts.append('</body>')
    html_parts.append('</html>')
    
    with open(OUTPUT_FILE, 'w') as f:
        f.write('\n'.join(html_parts))
        
    print(f"Generated {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_html_from_json()
