# dctx - Context-Driven Development CLI

Dead simple persistent context for AI-assisted coding. No more "what's your API key setup?" every session.

## The Problem

You spend 30 minutes explaining your project to an AI. Close the tab. Come back tomorrow:

> "Hi! I'm a helpful assistant. What would you like to build today?"

💀

## The Solution

Markdown files that live in your repo. Any AI can read them.

```
your-project/
├── .dctx/
│   ├── product.md      # What you're building
│   ├── tech-stack.md   # Your setup, API keys, preferences
│   ├── routes.md       # Which AI model for which task
│   ├── workflow.md     # How you work
│   └── tracks/         # Current and past tasks
│       └── 20250102-143052/
│           ├── spec.md
│           └── plan.md
```

## Install

```bash
# Clone or download
git clone <this-repo>
cd dctx

# Install
chmod +x install.sh
./install.sh

# Or just copy the script
cp dctx ~/.local/bin/
chmod +x ~/.local/bin/dctx
```

## Usage

```bash
# Initialize in your project
cd your-project
dctx init

# Edit your context
dctx context    # Edit product.md
dctx stack      # Edit tech-stack.md
dctx routes     # Edit routing rules

# Start a new feature/task
dctx track "Add user authentication"

# See where you left off
dctx status

# Get full context for any AI
dctx prompt | pbcopy

# Paste into Claude, ChatGPT, Gemini, whatever
# They now know EVERYTHING about your project
```

## Multi-Model Routing

The `routes.md` file tells AIs when to use different models:

```markdown
### Use Vision Model When:
- Task involves images/UI/screenshots
- Analyzing PDF pages visually

### Use MiniMax M2.1 When:
- Quick code generation
- Refactoring

### Use Gemini 3 Pro When:
- Architecture decisions
- Complex debugging
```

## Commands

| Command | Description |
|---------|-------------|
| `dctx init` | Initialize in current project |
| `dctx status` | Show current track and progress |
| `dctx track "name"` | Create new feature/bug track |
| `dctx plan` | Edit current track's plan |
| `dctx spec` | Edit current track's spec |
| `dctx done` | Mark track complete |
| `dctx list` | List all tracks |
| `dctx switch <id>` | Switch to different track |
| `dctx prompt` | Output full context (pipe to clipboard) |

## Pre-configured For

This version comes pre-configured with:

- **Gemini 3 Pro** for everything (via Antigravity / Gemini CLI)
- **MinerU 2.5 CLI** for local PDF parsing (no page limits, no browser)
- **Antigravity** as IDE

Edit `.dctx/tech-stack.md` to customize.

## Why Not Conductor?

Conductor is great but:
1. Tied to Gemini CLI
2. More complex
3. This is just markdown files + a helper script

Use Conductor if you want enforcement. Use dctx if you want simplicity.

## The Secret

There's no magic. It's literally just:

1. Markdown files
2. A script that manages them
3. `dctx prompt` that concatenates them for any AI

That's it. You could do this manually. The CLI just makes it faster.

## License

MIT. Do whatever you want with it.
