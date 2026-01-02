# Development Workflow

## Before Starting Any Task
1. Read .dctx/product.md for project context
2. Read .dctx/tech-stack.md for environment setup
3. Check .dctx/tracks/ for current active track
4. Follow routing rules in .dctx/routes.md

## Creating New Features
1. `dctx track "feature name"` - creates spec + plan files
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
