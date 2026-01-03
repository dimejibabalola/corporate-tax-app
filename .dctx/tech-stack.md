# Tech Stack & Environment

## Models
- **Primary**: Gemini 3 Pro (via Antigravity / Gemini CLI)
- **Fallback**: Gemini 3 Flash (if Pro hits rate limits)
- That's it. Keep it simple.

## API Keys (stored in .env)
- GEMINI_API_KEY - for Gemini CLI
- Never ask about API key setup - already configured

## PDF Parsing (MinerU 2.5)
- **NOT using**: PyPDF2, pdfplumber, Tesseract, tabula-py (outdated)
- Install: `uv pip install -U "mineru[all]"`
- Run: `mineru -p input.pdf -o output_folder/`
- NO page limits, NO browser uploads
- **Output**: markdown + content_list.json (tables, equations, footnotes)

## Folder Structure
```
/parsed-chapters
  /ch01
    /part1   (pages 1-20)
    /part2   (pages 21-40)
  /ch02
  ...
```

## Development Environment
- IDE: Google Antigravity / Cursor
- CLI: Gemini CLI
- Package manager: uv for Python, npm for Node
- OS: macOS

## NEVER SUGGEST
- PyPDF2, pdfplumber, Tesseract, tabula-py
- Python 3.7 (we use 3.12 with uv)
- Any "basic" PDF solution - we have MinerU

