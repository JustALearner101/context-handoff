---
name: handoff-export
description: Export current session context to handoff.md for use in another AI coding tool
---

Generate a structured handoff document and save it as `handoff.md` in the project root.
Follow this schema EXACTLY:

# 🤝 Context Handoff

## Meta
- exported_at: [current ISO 8601 timestamp]
- exported_from: opencode
- session_id: [short random ID]

## Project
- name, stack, root, package_manager

## Current Task
[One paragraph — specific]

## Progress
- [x] done items
- [ ] pending items

## Active Files
- path/to/file — description

## Blocker
[Exact error or "None"]

## Key Decisions
- bullet list

## Environment
[versions, env vars, dev command]

## Next Steps
1. First action

## For the Next AI
- Read Active Files before doing anything
- Do NOT change Key Decisions without flagging first

After writing: "✅ handoff.md written. Run /handoff-load in your next tool."
