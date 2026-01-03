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

WORKFLOW:

Step 1: Request upload URLs
POST https://mineru.net/api/v4/file-urls/batch
Headers: 
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
{
  "files": [
    {"name": "ch02.pdf", "data_id": "ch02"},
    {"name": "ch03.pdf", "data_id": "ch03"},
    ... (all chapters)
  ],
  "model_version": "vlm"
}

Response gives: batch_id + file_urls array

Step 2: Upload each PDF via PUT
For each file_url returned:
  PUT {file_url} with PDF binary data (no Content-Type header needed)

Step 3: Poll for results
GET https://mineru.net/api/v4/extract-results/batch/{batch_id}
Headers: Authorization: Bearer {token}

Poll every 30 seconds until all files show state="done"

Step 4: Download results
For each file with state="done", download full_zip_url
Extract to ./parsed-chapters/ch02/, ch03/, etc.

PDFs located at: [YOUR PDF FOLDER PATH]
Parse chapters 2-15. Update plan.md after each completes.

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

## Deployment Configuration
### Vercel & Supabase
1. **Redirect URLs**: Ensure Supabase Auth settings include your Vercel URL.
   - Go to Supabase Dashboard > Authentication > URL Configuration.
   - Add `https://workspace-dimeji-babalolas-projects.vercel.app/**` to **Redirect URLs**.
   - Set **Site URL** to `https://workspace-dimeji-babalolas-projects.vercel.app`.
2. **Environment Variables**:
   - Ensure `VITE_APP_URL` in Vercel settings matches the deployment URL.

## MCP Usage Guide
Use the Model Context Protocol (MCP) servers to manage infrastructure directly from the chat.

### Supabase MCP
- **List Projects**: `mcp_supabase-mcp-server_list_projects` - Find project IDs.
- **Get URL**: `mcp_supabase-mcp-server_get_project_url` (Project ID: `wjokjfaffcboifkxkhlz`)
  - **Current Project URL**: `https://wjokjfaffcboifkxkhlz.supabase.co`
- **Database**: Use `mcp_supabase-mcp-server_execute_sql` for queries (read-only recommended).

### Vercel MCP
- Use for checking deployment status and inspecting build logs if available.

### GitHub MCP
- Use `mcp_github-mcp-server_search_repositories` or `list_pull_requests` to manage code usage.
