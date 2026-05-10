---
name: handoff-load
description: Load session context from handoff.md exported by another AI coding tool
---

Read `handoff.md` from the project root.

If it doesn't exist: "❌ No handoff.md found. Ask the previous AI to run /handoff-export first."

If it exists:
1. Read the file completely
2. Read every file listed under Active Files (silently)
3. Confirm with:
   ✅ Context loaded from [exported_from] session [session_id]
   Project: [name] — [stack]
   Task: [current task]
   Blocker: [blocker or None]
   I'll start with: [Next Steps item 1]
4. Begin working on Next Steps item 1 immediately
5. Follow "For the Next AI" instructions exactly
6. Do NOT change Key Decisions without flagging first
