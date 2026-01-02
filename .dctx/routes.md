# Model Routing Rules

## Decision Tree

```
Is this task about images/UI/screenshots?
├── YES → Use vision model (Qwen2.5-VL, MiniCPM-V 4.5)
└── NO
    └── Is this quick code generation?
        ├── YES → Use MiniMax M2.1
        └── NO
            └── Is this planning/architecture?
                ├── YES → Use Gemini 3 Pro
                └── NO → Default to M2.1
```

## Specific Triggers

### Use Vision Model When:
- User uploads image/screenshot
- Task mentions "UI", "layout", "design", "screenshot"
- Analyzing PDF pages visually
- Debugging frontend visual issues

### Use M2.1 When:
- Writing new functions/methods
- Refactoring existing code
- Quick bug fixes
- Boilerplate generation
- Test writing

### Use Gemini 3 Pro When:
- Multi-file architecture decisions
- Complex debugging requiring reasoning
- Planning new features
- Reviewing PRs for logic issues

### Use MinerU When:
- Parsing PDF documents
- Extracting tables from PDFs
- Converting textbook chapters to structured data
