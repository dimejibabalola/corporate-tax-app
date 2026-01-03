# Track: Textbook PDF Parsing
Started: 2026-01-03
Status: Cancelled
Goal: Parse "Fundamentals of Corporate Taxation.pdf" using Mineru to generate structured markdown and JSON.

## Context
- We need to parse the full textbook to enable the frontend learning app.
- Using `mineru` (MinerU 2.5) as per tech stack.
- Input: `pdf-processing/Fundamentals of Corporate Taxation.pdf`
- Output: `pdf-processing/output_folder/`

## Steps
- [x] Install `mineru[all]` via `uv` in `.venv`
- [x] Run `mineru` conversion on full PDF (Cancelled by user request)
- [ ] Verify output structure (markdown + images)
- [ ] Move/Process output to `parsed-chapters/`
