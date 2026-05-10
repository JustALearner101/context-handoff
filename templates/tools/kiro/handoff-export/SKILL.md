---
name: handoff-export
description: Export current session context to handoff.md for seamless handoff to another AI coding tool. Use when context window is full or switching to a different AI tool.
---

You are about to hand off this session to another AI coding tool.

Generate a structured handoff document and save it as `handoff.md` in the project root.
Follow this schema EXACTLY — do not skip any section:

# 🤝 Context Handoff

## Meta
- **exported_at**: [current ISO 8601 timestamp]
- **exported_from**: kiro
- **session_id**: [generate a short random ID, e.g. a8f3c1]

## Project
- **name**: [project/repo name]
- **stack**: [comma-separated list of main technologies]
- **root**: [absolute path to project root]
- **package_manager**: [npm / pnpm / yarn / pip / etc]

## Current Task
[One clear paragraph describing what we are working on right now.
Be specific — include feature name, module, endpoint, etc.]

## Progress
[Checklist format. Mark done items [x] and pending [ ].]
- [x] Example: installed dependency X
- [ ] Example: fix the current blocker

## Active Files
[List every file that is relevant or was modified this session.]
- path/to/file.ts — one-line description

## Blocker
[Current error or blocker with exact error message. "None" if clear.]

## Key Decisions
[Bullet list of decisions the next AI must not reverse.]

## Environment
[Runtime version, relevant env vars, dev command, port, etc.]

## Next Steps
[Ordered list. Item 1 is the immediate next action.]
1. First thing to do

## For the Next AI
[Direct imperative instructions.]
- Read all Active Files before doing anything.
- Do NOT change Key Decisions without flagging first.

---

After writing handoff.md, confirm with:
✅ handoff.md written to project root.
Switch to your next tool and run /handoff-load to continue.

Summary:
- Task: [one line]
- Next step: [one line]
- Blocker: [one line or "None"]
