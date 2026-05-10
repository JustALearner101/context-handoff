# Cursor — Manual Snippets

Cursor does not support custom slash commands natively.
Copy-paste these into Cursor's AI chat panel as needed.

---

## EXPORT (paste when you want to hand off)

Generate a structured handoff document and save it as `handoff.md` in the project root with these sections: Meta (exported_at, exported_from: cursor, session_id), Project (name/stack/root/package_manager), Current Task (one paragraph), Progress (checklist), Active Files (path + description), Blocker (exact error or None), Key Decisions (bullet list), Environment (versions/env vars/dev command), Next Steps (ordered list), For the Next AI (direct instructions). After writing confirm with a one-line summary of task/next step/blocker.

---

## IMPORT (paste when starting in Cursor after handoff)

Read `handoff.md` from the project root. If missing say so. If found: read it + all files under Active Files, then confirm with: project name, task, blocker, and what you'll do first. Follow "For the Next AI" instructions exactly. Do not change Key Decisions without flagging. Start working immediately.
