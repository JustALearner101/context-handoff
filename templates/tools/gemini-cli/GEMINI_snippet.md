# context-handoff

## /handoff-export

When the user runs /handoff-export:

Generate a structured handoff document and save it as `handoff.md` in the project root.
Follow this schema EXACTLY:

# 🤝 Context Handoff

## Meta
- exported_at: [current ISO 8601 timestamp]
- exported_from: gemini-cli
- session_id: [short random ID]

## Project
- name, stack, root, package_manager

## Current Task
[One paragraph — specific, include feature/module/endpoint]

## Progress
[Checklist: [x] done, [ ] pending]

## Active Files
[path — one-line description, one per line]

## Blocker
[Exact error or "None"]

## Key Decisions
[Bullet list — next AI must not reverse these]

## Environment
[Node/Python version, env vars needed, dev command, port]

## Next Steps
[Ordered list, item 1 = immediate next action]

## For the Next AI
[Direct imperative instructions]

After writing the file respond with:
✅ handoff.md written. Switch tools and run /handoff-load to continue.
Summary: Task / Next step / Blocker

---

## /handoff-load

When the user runs /handoff-load:

Read `handoff.md` from the project root. If it doesn't exist respond:
❌ No handoff.md found. Ask the previous AI to run /handoff-export first.

If it exists:
1. Read the file completely
2. Read every file listed under Active Files (silently)
3. Respond with:
   ✅ Context loaded from [exported_from] session [session_id]
   Project: [name] — [stack]
   Task: [current task]
   Blocker: [blocker or None]
   I'll start with: [Next Steps item 1]
4. Immediately begin working on Next Steps item 1
5. Follow all instructions in "For the Next AI" exactly
6. Do NOT change Key Decisions without flagging first
