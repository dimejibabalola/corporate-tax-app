#!/usr/bin/env python3
"""
Restructure Chapter 1 HTML with proper hierarchical sections.
"""

import re
import sys

def restructure_html(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # Section header mapping with proper hierarchy
    # Main sections (A-H) -> h2
    main_sections = {
        'a.-introduction-to-taxation-of-business-entities': ('A. INTRODUCTION TO TAXATION OF BUSINESS ENTITIES', 'section-a'),
        'b.-influential-policies': ('B. INFLUENTIAL POLICIES', 'section-b'),
        'c.-introduction-to-choice-of-business-entity': ('C. CHOICE OF BUSINESS ENTITY', 'section-c'),
        'd.-the-corporation-as-a-taxable-entity': ('D. THE CORPORATE INCOME TAX', 'section-d'),
        'e.-corporate-classification': ('E. CLASSIFICATION OF BUSINESS ENTITIES', 'section-e'),
        'f.-the-common-law-of-corporate-taxation': ('F. ANTI-AVOIDANCE DOCTRINES', 'section-f'),
        'g.-recognition-of-the-corporate-entity': ('G. RECOGNITION OF THE CORPORATE ENTITY', 'section-g'),
        'h.-tax-policy-issues': ('H. TAX POLICY ISSUES', 'section-h'),
    }
    
    # Subsections (1, 2, 3) -> h3
    subsections = {
        'the-corporate-income-tax': ('1. THE CORPORATE INCOME TAX', 'section-d-1'),
        'multiple-and-affiliated-corporations': ('2. MULTIPLE AND AFFILIATED CORPORATIONS', 'section-d-2'),
        'in-general': ('1. IN GENERAL', 'section-e-1'),
        'corporations-vs.partnerships': ('2. CORPORATIONS VS. PARTNERSHIPS', 'section-e-2'),
        'corporations-vs.trusts': ('3. CORPORATIONS VS. TRUSTS', 'section-e-3'),
        'introduction': ('1. INTRODUCTION', 'section-h-1'),
        'corporate-integration': ('2. CORPORATE INTEGRATION', 'section-h-2'),
        'other-corporate-tax-reform-options': ('3. OTHER CORPORATE TAX REFORM OPTIONS', 'section-h-3'),
    }
    
    # Sub-subsections (a, b, c) -> h4
    sub_subsections = {
        'a.-check-the-box-regulations': ('a. "Check-the-Box" Regulations', 'section-e-2-a'),
        'b.-publicly-traded-partnerships': ('b. Publicly Traded Partnerships', 'section-e-2-b'),
        'a.-background-and-issues': ('A. Background and Issues', 'section-jct-a'),
        'b.-integration-approaches': ('B. Integration Approaches', 'section-jct-b'),
    }
    
    # Special elements (problems, cases, etc.)
    special = {
        'problem': ('PROBLEM', 'problem-1'),
        'commissioner-v.-bollinger': ('Commissioner v. Bollinger', 'case-bollinger'),
        'note': ('NOTE', 'note-1'),
    }
    
    # Add additional CSS
    css_addition = '''
/* Section Header Styles */
.main-section {
    font-size: 1.5em;
    font-weight: bold;
    margin-top: 2em;
    padding-bottom: 0.5em;
    border-bottom: 2px solid #0066cc;
    color: #003366;
}

.subsection {
    font-size: 1.3em;
    font-weight: bold;
    margin-top: 1.5em;
    color: #004080;
}

.sub-subsection {
    font-size: 1.1em;
    font-weight: 600;
    margin-top: 1.2em;
    color: #336699;
    font-style: italic;
}

.case-excerpt {
    background-color: #f9f9f9;
    border-left: 4px solid #8B0000;
    padding: 1.5em;
    margin: 2em 0;
}

.case-excerpt h3 {
    color: #8B0000;
    font-variant: small-caps;
}

.excerpt {
    background-color: #f5f5dc;
    border-left: 4px solid #556B2F;
    padding: 1.5em;
    margin: 2em 0;
}

.excerpt h3 {
    color: #556B2F;
}

.problems {
    background-color: #fff8dc;
    border: 1px solid #daa520;
    padding: 1em;
    margin: 1.5em 0;
    border-radius: 5px;
}

.chapter-title {
    text-align: center;
    font-size: 2em;
    margin-bottom: 0.5em;
}

.chapter-subtitle {
    text-align: center;
    font-size: 1.4em;
    margin-bottom: 2em;
    color: #444;
}

/* Table of Contents */
#toc {
    background: #f8f8f8;
    border: 1px solid #ddd;
    padding: 1.5em 2em;
    margin: 2em 0;
    border-radius: 5px;
}

#toc h2 {
    margin-top: 0;
    color: #003366;
}

#toc ul {
    list-style: none;
    padding-left: 0;
}

#toc ul ul {
    padding-left: 1.5em;
}

#toc a {
    text-decoration: none;
    color: #0066cc;
}

#toc a:hover {
    text-decoration: underline;
}
'''
    
    # Insert CSS before </style>
    html = html.replace('</style>', css_addition + '\n</style>')
    
    # Convert main sections h1 -> h2
    for old_id, (title, new_id) in main_sections.items():
        pattern = rf'<h1 id="{re.escape(old_id)}">[^<]*(?:</h1>|(?:\n[^<]*)+</h1>)'
        replacement = f'<h2 class="main-section" id="{new_id}">{title}</h2>'
        html = re.sub(pattern, replacement, html, flags=re.IGNORECASE)
    
    # Convert subsections h1 -> h3
    for old_id, (title, new_id) in subsections.items():
        pattern = rf'<h1 id="{re.escape(old_id)}">[^<]*(?:</h1>|(?:\n[^<]*)+</h1>)'
        replacement = f'<h3 class="subsection" id="{new_id}">{title}</h3>'
        html = re.sub(pattern, replacement, html, flags=re.IGNORECASE)
    
    # Convert sub-subsections h1 -> h4
    for old_id, (title, new_id) in sub_subsections.items():
        pattern = rf'<h1 id="{re.escape(old_id)}">[^<]*(?:</h1>|(?:\n[^<]*)+</h1>)'
        replacement = f'<h4 class="sub-subsection" id="{new_id}">{title}</h4>'
        html = re.sub(pattern, replacement, html, flags=re.IGNORECASE)
    
    # Fix Chapter 1 headers
    html = re.sub(
        r'<h1 id="chapter-1">CHAPTER 1</h1>\s*<h1 id="an-overview[^"]*">[^<]*(?:</h1>|\n[^<]*</h1>)',
        '<h1 class="chapter-title" id="chapter-1">CHAPTER 1</h1>\n<h2 class="chapter-subtitle">AN OVERVIEW OF THE TAXATION OF CORPORATIONS AND SHAREHOLDERS</h2>',
        html,
        flags=re.IGNORECASE | re.DOTALL
    )
    
    # Fix case excerpt (Bollinger)
    html = re.sub(
        r'<h1 id="commissioner-v.-bollinger">([^<]+)</h1>',
        r'<div class="case-excerpt">\n<h3 id="case-bollinger">Commissioner v. Bollinger</h3>',
        html
    )
    
    # Add closing div for case (before next major section)
    # This is a heuristic - we'll close it before section G's next header
    
    # Fix JCT excerpt header
    html = re.sub(
        r'<h1 id="joint-committee-on-taxation[^"]*">[^<]*(?:</h1>|(?:\n[^<]*)+</h1>)',
        '<div class="excerpt">\n<h3 id="jct-excerpt">Joint Committee on Taxation: Present Law and Background Relating to Selected Business Tax Issues</h3>',
        html,
        flags=re.IGNORECASE
    )
    
    # Fix remaining h1 tags for section II, IV etc within extracts
    html = re.sub(r'<h1 id="ii\.">II\.</h1>', '<h4>II.</h4>', html)
    html = re.sub(r'<h1 id="iv\.-corporate-integration">IV\. CORPORATE INTEGRATION</h1>', '<h4>IV. CORPORATE INTEGRATION</h4>', html)
    
    # Fix problem section
    html = re.sub(
        r'<h1 id="problem">PROBLEM</h1>',
        '<div class="problems">\n<h4 id="problem-1">PROBLEM</h4>',
        html
    )
    
    # Fix note section
    html = re.sub(
        r'<h1 id="note">NOTE</h1>',
        '<h4 id="note-1">NOTE</h4>',
        html
    )
    
    # Remove Part Two headers (they shouldn't be in Ch1)
    html = re.sub(r'<h1 id="part-two">PART TWO</h1>\s*<h1 id="taxation-of-c-corporations">TAXATION OF C CORPORATIONS</h1>', '', html)
    
    # Add Table of Contents after chapter subtitle
    toc = '''
<nav id="toc">
<h2>Table of Contents</h2>
<ul>
<li><a href="#section-a">A. Introduction to Taxation of Business Entities</a></li>
<li><a href="#section-b">B. Influential Policies</a></li>
<li><a href="#section-c">C. Choice of Business Entity</a></li>
<li><a href="#section-d">D. The Corporate Income Tax</a>
  <ul>
    <li><a href="#section-d-1">1. The Corporate Income Tax</a></li>
    <li><a href="#section-d-2">2. Multiple and Affiliated Corporations</a></li>
  </ul>
</li>
<li><a href="#section-e">E. Classification of Business Entities</a>
  <ul>
    <li><a href="#section-e-1">1. In General</a></li>
    <li><a href="#section-e-2">2. Corporations vs. Partnerships</a></li>
    <li><a href="#section-e-3">3. Corporations vs. Trusts</a></li>
  </ul>
</li>
<li><a href="#section-f">F. Anti-Avoidance Doctrines</a></li>
<li><a href="#section-g">G. Recognition of the Corporate Entity</a>
  <ul>
    <li><a href="#case-bollinger">Bollinger v. Commissioner (Case)</a></li>
  </ul>
</li>
<li><a href="#section-h">H. Tax Policy Issues</a>
  <ul>
    <li><a href="#section-h-1">1. Introduction</a></li>
    <li><a href="#section-h-2">2. Corporate Integration</a></li>
    <li><a href="#section-h-3">3. Other Corporate Tax Reform Options</a></li>
  </ul>
</li>
<li><a href="#footnotes">Footnotes</a></li>
</ul>
</nav>
'''
    
    # Insert TOC after chapter subtitle
    html = re.sub(
        r'(<h2 class="chapter-subtitle">AN OVERVIEW OF THE TAXATION OF CORPORATIONS AND SHAREHOLDERS</h2>)',
        r'\1\n' + toc,
        html
    )
    
    # Write output
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)
    
    print(f"Restructured HTML written to {output_file}")

if __name__ == '__main__':
    input_file = 'parsed-chapters/Ch1_complete_fixed.html'
    output_file = 'public/data/chapters/ch1_structured.html'
    restructure_html(input_file, output_file)
