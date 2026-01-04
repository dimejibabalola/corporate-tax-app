import re
import os

INPUT_FILE = 'parsed-chapters/Ch1_complete_fixed.html'
OUTPUT_FILE = 'public/Ch1_complete.html'

def title_case(text):
    # Keep specific terms uppercase
    keep_upper = ['IRC', 'I.R.C.', 'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV']
    
    words = text.split()
    new_words = []
    for word in words:
        clean_word = word.strip('.,')
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

# Content casing map (User provided)
CASING_MAP = {
    'CHAPTER 1': 'Chapter 1',
    'AN OVERVIEW OF THE TAXATION OF CORPORATIONS AND SHAREHOLDERS': 'An Overview of the Taxation of Corporations and Shareholders',
    'A. INTRODUCTION TO TAXATION OF BUSINESS ENTITIES': 'A. Introduction to Taxation of Business Entities',
    'B. INFLUENTIAL POLICIES': 'B. Influential Policies',
    'C. INTRODUCTION TO CHOICE OF BUSINESS ENTITY': 'C. Introduction to Choice of Business Entity',
    'D. THE CORPORATION AS A TAXABLE ENTITY': 'D. The Corporation as a Taxable Entity',
    '1. THE CORPORATE INCOME TAX': '1. The Corporate Income Tax',
    '2. MULTIPLE AND AFFILIATED CORPORATIONS': '2. Multiple and Affiliated Corporations',
    'PROBLEM': 'Problem',
    'E. CORPORATE CLASSIFICATION': 'E. Corporate Classification',
    '1. IN GENERAL': '1. In General',
    '2. CORPORATIONS VS.PARTNERSHIPS': '2. Corporations vs. Partnerships',
    'a. "CHECK-THE-BOX" REGULATIONS': 'a. "Check-the-Box" Regulations',
    'b. PUBLICLY TRADED PARTNERSHIPS': 'b. Publicly Traded Partnerships',
    '3. CORPORATIONS VS.TRUSTS': '3. Corporations vs. Trusts',
    'F. THE COMMON LAW OF CORPORATE TAXATION': 'F. The Common Law of Corporate Taxation',
    'G. RECOGNITION OF THE CORPORATE ENTITY': 'G. Recognition of the Corporate Entity',
    'H. TAX POLICY ISSUES': 'H. Tax Policy Issues',
    '1. INTRODUCTION': '1. Introduction',
    '2. CORPORATE INTEGRATION': '2. Corporate Integration',
    'NOTE': 'Note',
    '3. OTHER CORPORATE TAX REFORM OPTIONS': '3. Other Corporate Tax Reform Options'
}

CSS_STYLES = """
<style>
.ch1-content {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 17px;
  line-height: 1.7;
  color: #2d2d2d;
  max-width: 750px;
  margin: 0 auto;
  padding: 40px 24px;
}

.ch1-content .chapter-num {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  color: #666666;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.ch1-content .chapter-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a365d;
  margin-top: 0;
  margin-bottom: 40px;
  line-height: 1.3;
  border-bottom: 3px solid #3182ce;
  padding-bottom: 16px;
}

.ch1-content h2.section {
  font-size: 22px;
  font-weight: 700;
  color: #1a365d;
  margin-top: 48px;
  margin-bottom: 20px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.ch1-content h3.subsection {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin-top: 32px;
  margin-bottom: 16px;
}

.ch1-content h4.subsubsection {
  font-size: 16px;
  font-weight: 600;
  color: #4a5568;
  margin-top: 24px;
  margin-bottom: 12px;
}

.ch1-content h4.case-name {
  font-size: 17px;
  font-weight: 600;
  font-style: italic;
  color: #2d3748;
  margin-top: 32px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #edf2f7;
  border-left: 4px solid #3182ce;
}

.ch1-content h4.special-section {
  font-size: 15px;
  font-weight: 700;
  color: #744210;
  background: #fefcbf;
  padding: 8px 12px;
  margin-top: 24px;
  margin-bottom: 12px;
  display: inline-block;
}

.ch1-content h5.case-section {
  font-size: 14px;
  font-weight: 600;
  color: #718096;
  margin-top: 20px;
  margin-bottom: 8px;
}

.ch1-content p {
  margin: 0 0 16px 0;
  text-align: justify;
}

.ch1-content .fn-ref {
  font-size: 0.75em;
  vertical-align: super;
  line-height: 0;
}

.ch1-content .fn-ref a {
  color: #3182ce;
  text-decoration: none;
  padding: 0 1px;
}

.ch1-content .fn-ref a:hover {
  text-decoration: underline;
  background: #ebf8ff;
}

.ch1-content .footnote {
  font-size: 14px;
  color: #4a5568;
  padding: 12px 0;
  border-bottom: 1px solid #e2e8f0;
  line-height: 1.5;
}

.ch1-content .fn-num {
  font-weight: 700;
  color: #3182ce;
  margin-right: 8px;
}

.ch1-content #footnotes {
  margin-top: 60px;
  padding-top: 32px;
  border-top: 2px solid #3182ce;
}

.ch1-content :target {
  background: #fefcbf;
  padding: 4px 8px;
  margin: -4px -8px;
}
</style>
"""

def transform_tag(match):
    full_tag = match.group(0)
    text_content = match.group(1)
    
    # 1.2 - Convert ALL CAPS strings primarily
    # We do this logic first so we essentially replace the content inside the tag
    # But we need to be careful not to double process or mess up if regex doesn't match perfectly
    
    # Clean text for comparison (remove newlines/extra spaces for matching known keys)
    clean_text = ' '.join(text_content.split())
    
    final_text = text_content
    found_replacement = False
    
    # Check exact matches first
    if clean_text in CASING_MAP:
        final_text = CASING_MAP[clean_text]
        found_replacement = True
    
    # Heuristics for others if not in map but roughly uppercase? 
    # The prompt implies "Convert ALL CAPS to Title Case" generally for the listed items.
    # But let's stick to the specific logic for tag replacement which is robust.
    
    # 1.1 - Change heading tags based on content pattern
    clean_compare = final_text if found_replacement else clean_text
    
    if clean_compare == "Chapter 1" or clean_text == "CHAPTER 1":
        return f'<p class="chapter-num">{final_text}</p>'
    
    if "Overvire of the Taxation" in clean_compare or "OVERVIEW OF THE TAXATION" in clean_text:
         return f'<h1 class="chapter-title">{final_text}</h1>'
         
    # Starts with A. through H.
    if re.match(r'^[A-H]\.', clean_compare):
        return f'<h2 class="section">{final_text}</h2>'
        
    # Starts with 1., 2. etc
    if re.match(r'^\d+\.', clean_compare):
        return f'<h3 class="subsection">{final_text}</h3>'
        
    # Starts with a., b. etc
    if re.match(r'^[a-z]\.', clean_compare):
         return f'<h4 class="subsubsection">{final_text}</h4>'
    
    # Contains v. (case name)
    if ' v. ' in clean_compare:
        return f'<h4 class="case-name">{final_text}</h4>'
        
    # Exactly Problem or Note
    if clean_compare in ['Problem', 'Note'] or clean_text in ['PROBLEM', 'NOTE']:
        return f'<h4 class="special-section">{final_text}</h4>'
        
    # Roman numeral only (I., II. etc) - checking roughly
    if re.match(r'^[IVX]+\.?$', clean_compare.strip()):
         return f'<h5 class="case-section">{final_text}</h5>'
         
    # Anything else -> h4
    return f'<h4>{final_text}</h4>'


def process_file():
    with open(INPUT_FILE, 'r') as f:
        content = f.read()
        
    # Inject CSS
    # Remove existing style tag if any or just append to head
    if '</head>' in content:
        content = content.replace('</head>', f'{CSS_STYLES}\n</head>')
    else:
        # If no head, just prepend to body or start
        content = CSS_STYLES + content
        
    # Regex to find h1 tags and transform them
    # Pattern looks for <h1 id="..."> CONTENT </h1> or just <h1> CONTENT </h1>
    # We need to capture attributes to preserve IDs if needed, but user guidelines suggest changing tags completely.
    # The user prompt table shows "Change from <h1>" to specific new tags. 
    # It doesn't explicitly say "keep the ID", but usually anchors are good. 
    # However, standardizing IDs based on usage in React component is handled by sidebar logic which uses specific IDs.
    # The React component uses IDs like "a.-introduction..." which usually come from pandoc generated HTML.
    # We should preserve IDs if possible or allow the browser to default.
    # But wait, the React logic does `scrollTo(item.id)` where item IDs are hardcoded in the TSX.
    # Those IDs in TSX are: 'a.-introduction-to-taxation-of-business-entities'
    # These look like the IDs generated by Pandoc.
    # So we MUST preserve the `id="..."` attribute if it exists on the h1.
    
    def replacer(match):
        attrs = match.group(1) # e.g. ' id="chapter-1"'
        text = match.group(2)
        
        # Determine new tag and class
        # We need the text to decide.
        
        # Apply Casing Map first to Text
        clean_text_key = ' '.join(text.split())
        display_text = CASING_MAP.get(clean_text_key, text)
        
        # Apply Logic
        tag_start = 'h4'
        tag_class = ''
        
        is_p = False
        
        if display_text == "Chapter 1":
            tag_start = 'p'
            tag_class = 'chapter-num'
            is_p = True
        elif "Overview of the Taxation" in display_text or "OVERVIEW OF THE TAXATION" in text:
            tag_start = 'h1'
            tag_class = 'chapter-title'
        elif re.match(r'^[A-H]\.', display_text):
            tag_start = 'h2'
            tag_class = 'section'
        elif re.match(r'^\d+\.', display_text):
            tag_start = 'h3'
            tag_class = 'subsection'
        elif re.match(r'^[a-z]\.', display_text):
            tag_start = 'h4'
            tag_class = 'subsubsection'
        elif ' v. ' in display_text:
            tag_start = 'h4'
            tag_class = 'case-name'
        elif display_text in ['Problem', 'Note']:
            tag_start = 'h4'
            tag_class = 'special-section'
        elif re.match(r'^[IVX]+\.?$', display_text.strip()):
            tag_start = 'h5'
            tag_class = 'case-section'
        else:
            tag_start = 'h4'
            tag_class = ''
            
        # Construct new tag
        # Preserve attrs (id)
        class_str = f' class="{tag_class}"' if tag_class else ''
        
        return f'<{tag_start}{attrs}{class_str}>{display_text}</{tag_start}>'

    # Regex: <h1( attributes)?>(content)</h1>
    # Handling newlines in content with dotall? No, h1 usually single line or wrapped.
    # Pattern: <h1([^>]*)>(.*?)<\/h1>
    content = re.sub(r'<h1([^>]*)>(.*?)<\/h1>', replacer, content, flags=re.DOTALL)
    
    with open(OUTPUT_FILE, 'w') as f:
        f.write(content)
        
    print(f"Processed {INPUT_FILE} -> {OUTPUT_FILE}")

if __name__ == "__main__":
    process_file()
