# context-handoff

> Export your AI coding session and resume it in any other tool — zero re-explaining.

When your Claude Code context is 90% full, don't start over. Run one command, get a `handoff.md`, and continue in Gemini CLI, OpenCode, Kiro, or any other tool — instantly.

## Quick Start

```bash
# Install for your tool(s)
npx context-handoff --tool claude-code
npx context-handoff --tool gemini-cli

# Or install for everything at once
npx context-handoff --all
```

Then in your current AI session:
```
/handoff-export
```

Switch to your next tool, then:
```
/handoff-load
```

Done. The new AI knows exactly where you left off.

## Supported Tools

| Tool | Export | Import | Config |
|------|--------|--------|--------|
| Claude Code | `/handoff-export` | `/handoff-load` | `.claude/commands/` |
| Gemini CLI | `/handoff-export` | `/handoff-load` | `GEMINI.md` |
| OpenCode | `/handoff-export` | `/handoff-load` | `.opencode/commands/` |
| Kiro | `/handoff-export` | `/handoff-load` | `.kiro/skills/` |
| Codex (OpenAI) | `/handoff-export` | `/handoff-load` | `.codex/prompts/` |
| Aider | `/handoff-export` | `/handoff-load` | `.aider.conf.yml` |
| Cursor | manual paste | manual paste | `.cursor/` (snippets) |

## What Gets Exported

The `handoff.md` file captures everything the next AI needs:

- **Current task** — what you're working on right now
- **Progress** — checklist of done and pending items  
- **Active files** — every file that's relevant or was modified
- **Blocker** — current error with exact message
- **Key decisions** — architectural choices the next AI must respect
- **Environment** — versions, env vars, dev commands
- **Next steps** — ordered action list
- **Instructions for next AI** — direct imperative guidance

## CLI Reference

```bash
npx context-handoff --tool <name>   # Install for specific tool
npx context-handoff --all           # Install for all tools
npx context-handoff --validate      # Validate handoff.md schema/content
npx context-handoff --list          # List supported tools
npx context-handoff --dry-run       # Preview file changes (no writes)
npx context-handoff --force         # Allow overwriting/appending where applicable
npx context-handoff --help          # Help
```

Notes:
- By default, the installer will not overwrite existing files. Use `--force` to overwrite.
- Use `--dry-run` to see what would change without modifying files.

## How It Works

1. Run `/handoff-export` → AI writes `handoff.md` to project root
2. Open your next tool in the same directory
3. Run `/handoff-load` → AI reads the file and picks up the task

No server. No account. No internet. Just a Markdown file.

## Adding a New Tool

1. Fork and create branch `feature/tool-<toolname>`
2. Add folder `templates/tools/<toolname>/`
3. Add `handoff-export.<ext>` and `handoff-load.<ext>` in the tool's native format
4. Add an installer case in `bin/cli.js`
5. Update this README
6. Open a PR with a demo screenshot

## License

MIT
