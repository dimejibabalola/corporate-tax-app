# Development Workflow

## Before Starting Any Task
1. Read .dctx/product.md for project context
2. Read .dctx/tech-stack.md for environment setup
3. Check .dctx/tracks/ for current active track
4. Follow routing rules in .dctx/routes.md

## PDF Parsing (MinerU 2.5) - LOCAL CLI
- Install: `uv pip install -U "mineru[all]"`
- Run: `mineru -p input.pdf -o output_folder/`
- NO page limits, NO browser uploads

## Creating New Features
1. `dctx track "feature name"` - creates spec + plan
2. Edit spec.md with requirements
3. Edit plan.md with implementation steps
4. Work through plan, checking off completed items
5. `dctx done` when complete

## Code Standards
- TypeScript for frontend
- Python for backend/ML
- Always include error handling
- Write tests for new functions
- Comment complex logic

## Git Workflow
- Branch per track: `track/<track-id>-<name>`
- Commit after each plan step completed
- PR when track is done

## NEVER SUGGEST
- PyPDF2, pdfplumber, Tesseract, tabula-py for PDF parsing
- Python 3.7 (we're on 3.12 with uv)
- Manual regex for table extraction
- Any "basic" PDF solution - we have MinerU
