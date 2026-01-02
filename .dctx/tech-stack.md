# Tech Stack & Environment

## Models
- **Planning/Architecture**: Gemini 3 Pro (via Gemini CLI + Conductor or Antigravity)
- **Fast Coding**: MiniMax M2.1 (via OpenRouter or direct API)
- **Vision/UI Analysis**: Qwen2.5-VL or MiniCPM-V 4.5 (via OpenRouter)

## Model Routing Rules
- If task involves images/screenshots/UI → route to vision model
- If task is quick code generation/refactor → route to M2.1
- If task is architecture/planning/complex reasoning → route to Gemini 3 Pro
- If task involves PDF parsing → use MinerU (see below)

## API Keys (stored in .env)
- MINIMAX_API_KEY - for M2.1 direct access
- OPENROUTER_API_KEY - for model routing
- GEMINI_API_KEY - for Gemini CLI
- Never ask about API key setup - already configured

## PDF Parsing (MinerU)
- Using MinerU 2.5 for PDF extraction
- GPU inference via HuggingFace Space (20 page chunks)
- Local API: `mineru-api --host 0.0.0.0 --port 8000`
- Endpoint: POST http://localhost:8000/file_parse
- Output: markdown + content_list.json with tables, equations, footnotes

## Development Environment
- IDE: Google Antigravity
- CLI: Gemini CLI with Conductor extension
- Package manager: uv for Python, npm for Node

## Code Style
<!-- Add your preferences -->
- 
